import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

export interface PaymentRecord {
  id: string;
  invoiceNumber: string;
  description: string;
  amount: number;
  currency: string;
  dueDate: Date;
  paymentDate?: Date;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'partial';
  type: 'tuition' | 'fees' | 'supplies' | 'meals' | 'transportation' | 'activities' | 'books' | 'uniform' | 'technology' | 'other';
  paymentMethod?: 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash' | 'check' | 'online';
  childId: string;
  childName: string;
  receiptUrl?: string;
  invoiceUrl?: string;
  reference?: string;
  notes?: string;
  installments?: PaymentInstallment[];
  isRecurring: boolean;
  nextPaymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentInstallment {
  id: string;
  installmentNumber: number;
  amount: number;
  dueDate: Date;
  paymentDate?: Date;
  status: 'pending' | 'paid' | 'overdue';
  reference?: string;
}

export interface PaymentSummary {
  totalOutstanding: number;
  totalPaid: number;
  overdueAmount: number;
  upcomingAmount: number;
  totalPayments: number;
  paymentsByType: { [key: string]: number };
  paymentsByStatus: { [key: string]: number };
  monthlySpending: { month: string; amount: number }[];
}

export interface PaymentFilter {
  searchTerm: string;
  status: string[];
  type: string[];
  paymentMethod: string[];
  childId: string[];
  dateFrom?: Date;
  dateTo?: Date;
  amountFrom?: number;
  amountTo?: number;
  showOverdueOnly: boolean;
  showRecurringOnly: boolean;
}

@Component({
  selector: 'app-parent-payments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatCheckboxModule,
    MatMenuModule,
    MatTooltipModule,
    MatBadgeModule,
    MatExpansionModule,
    MatSlideToggleModule,
    MatProgressBarModule
  ],
  templateUrl: './payments.html',
  styleUrls: ['./payments.scss']
})
export class ParentPaymentsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // State signals
  loading = signal(false);
  payments = signal<PaymentRecord[]>([]);
  filteredPayments = signal<PaymentRecord[]>([]);
  paymentSummary = signal<PaymentSummary | null>(null);
  
  // Form and filters
  filterForm: FormGroup;
  activeFilters = signal<string[]>([]);
  
  // UI state
  selectedTab = signal(0);
  viewMode = signal<'list' | 'cards'>('cards');
  showFilterSidebar = signal(false);
  
  // Table configuration
  displayedColumns = ['invoice', 'description', 'child', 'amount', 'dueDate', 'status', 'actions'];
  
  // Filter options
  statusOptions = [
    { value: 'pending', label: 'Pendiente', color: 'orange' },
    { value: 'paid', label: 'Pagado', color: 'green' },
    { value: 'overdue', label: 'Vencido', color: 'red' },
    { value: 'partial', label: 'Parcial', color: 'blue' },
    { value: 'cancelled', label: 'Cancelado', color: 'grey' }
  ];
  
  typeOptions = [
    { value: 'tuition', label: 'Matrícula', icon: 'school' },
    { value: 'fees', label: 'Cuotas', icon: 'payment' },
    { value: 'supplies', label: 'Materiales', icon: 'inventory' },
    { value: 'meals', label: 'Comedor', icon: 'restaurant' },
    { value: 'transportation', label: 'Transporte', icon: 'directions_bus' },
    { value: 'activities', label: 'Actividades', icon: 'sports' },
    { value: 'books', label: 'Libros', icon: 'menu_book' },
    { value: 'uniform', label: 'Uniforme', icon: 'checkroom' },
    { value: 'technology', label: 'Tecnología', icon: 'computer' },
    { value: 'other', label: 'Otros', icon: 'more_horiz' }
  ];
  
  paymentMethodOptions = [
    { value: 'credit_card', label: 'Tarjeta de Crédito', icon: 'credit_card' },
    { value: 'debit_card', label: 'Tarjeta de Débito', icon: 'credit_card' },
    { value: 'bank_transfer', label: 'Transferencia', icon: 'account_balance' },
    { value: 'cash', label: 'Efectivo', icon: 'money' },
    { value: 'check', label: 'Cheque', icon: 'receipt_long' },
    { value: 'online', label: 'Pago Online', icon: 'language' }
  ];

  // Computed properties
  pendingPayments = computed(() => 
    this.filteredPayments().filter(p => p.status === 'pending')
  );
  
  overduePayments = computed(() => 
    this.filteredPayments().filter(p => p.status === 'overdue')
  );
  
  paidPayments = computed(() => 
    this.filteredPayments().filter(p => p.status === 'paid')
  );
  
  partialPayments = computed(() => 
    this.filteredPayments().filter(p => p.status === 'partial')
  );

  constructor(private fb: FormBuilder) {
    this.filterForm = this.createFilterForm();
    this.setupFilterSubscription();
  }

  ngOnInit() {
    this.loadPayments();
    this.loadPaymentSummary();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createFilterForm(): FormGroup {
    return this.fb.group({
      searchTerm: [''],
      status: [[]],
      type: [[]],
      paymentMethod: [[]],
      childId: [[]],
      dateFrom: [null],
      dateTo: [null],
      amountFrom: [null],
      amountTo: [null],
      showOverdueOnly: [false],
      showRecurringOnly: [false]
    });
  }

  private setupFilterSubscription() {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }

  private loadPayments() {
    this.loading.set(true);
    
    // Simulated API call with mock data
    setTimeout(() => {
      const mockPayments: PaymentRecord[] = [
        {
          id: '1',
          invoiceNumber: 'INV-2024-001',
          description: 'Matrícula 2024 - Primer Semestre',
          amount: 25000,
          currency: 'ARS',
          dueDate: new Date('2024-02-15'),
          paymentDate: new Date('2024-02-10'),
          status: 'paid',
          type: 'tuition',
          paymentMethod: 'credit_card',
          childId: '1',
          childName: 'Sofia García',
          receiptUrl: '/receipts/receipt-001.pdf',
          invoiceUrl: '/invoices/invoice-001.pdf',
          reference: 'TXN-001-2024',
          notes: 'Pago realizado con tarjeta de crédito',
          isRecurring: false,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-02-10')
        },
        {
          id: '2',
          invoiceNumber: 'INV-2024-002',
          description: 'Cuota Mensual - Marzo 2024',
          amount: 15000,
          currency: 'ARS',
          dueDate: new Date('2024-03-10'),
          status: 'pending',
          type: 'fees',
          childId: '1',
          childName: 'Sofia García',
          invoiceUrl: '/invoices/invoice-002.pdf',
          isRecurring: true,
          nextPaymentDate: new Date('2024-04-10'),
          createdAt: new Date('2024-02-28'),
          updatedAt: new Date('2024-02-28')
        },
        {
          id: '3',
          invoiceNumber: 'INV-2024-003',
          description: 'Materiales de Laboratorio',
          amount: 8500,
          currency: 'ARS',
          dueDate: new Date('2024-02-20'),
          status: 'overdue',
          type: 'supplies',
          childId: '2',
          childName: 'Mateo García',
          invoiceUrl: '/invoices/invoice-003.pdf',
          notes: 'Materiales para química y física',
          isRecurring: false,
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date('2024-02-20')
        },
        {
          id: '4',
          invoiceNumber: 'INV-2024-004',
          description: 'Comedor Escolar - Marzo',
          amount: 12000,
          currency: 'ARS',
          dueDate: new Date('2024-03-01'),
          paymentDate: new Date('2024-02-28'),
          status: 'paid',
          type: 'meals',
          paymentMethod: 'bank_transfer',
          childId: '1',
          childName: 'Sofia García',
          receiptUrl: '/receipts/receipt-004.pdf',
          reference: 'TXN-004-2024',
          isRecurring: true,
          nextPaymentDate: new Date('2024-04-01'),
          createdAt: new Date('2024-02-15'),
          updatedAt: new Date('2024-02-28')
        },
        {
          id: '5',
          invoiceNumber: 'INV-2024-005',
          description: 'Transporte Escolar - Cuota Mensual',
          amount: 18000,
          currency: 'ARS',
          dueDate: new Date('2024-03-15'),
          status: 'pending',
          type: 'transportation',
          childId: '2',
          childName: 'Mateo García',
          invoiceUrl: '/invoices/invoice-005.pdf',
          isRecurring: true,
          nextPaymentDate: new Date('2024-04-15'),
          createdAt: new Date('2024-03-01'),
          updatedAt: new Date('2024-03-01')
        },
        {
          id: '6',
          invoiceNumber: 'INV-2024-006',
          description: 'Libros de Texto 2024',
          amount: 22000,
          currency: 'ARS',
          dueDate: new Date('2024-03-20'),
          paymentDate: new Date('2024-03-05'),
          status: 'paid',
          type: 'books',
          paymentMethod: 'online',
          childId: '1',
          childName: 'Sofia García',
          receiptUrl: '/receipts/receipt-006.pdf',
          reference: 'TXN-006-2024',
          notes: 'Libros para todas las materias',
          isRecurring: false,
          createdAt: new Date('2024-02-20'),
          updatedAt: new Date('2024-03-05')
        },
        {
          id: '7',
          invoiceNumber: 'INV-2024-007',
          description: 'Actividades Extracurriculares',
          amount: 9500,
          currency: 'ARS',
          dueDate: new Date('2024-03-25'),
          status: 'partial',
          type: 'activities',
          childId: '2',
          childName: 'Mateo García',
          invoiceUrl: '/invoices/invoice-007.pdf',
          notes: 'Pago parcial realizado: $4500',
          installments: [
            {
              id: '7a',
              installmentNumber: 1,
              amount: 4500,
              dueDate: new Date('2024-03-25'),
              paymentDate: new Date('2024-03-20'),
              status: 'paid',
              reference: 'TXN-007A-2024'
            },
            {
              id: '7b',
              installmentNumber: 2,
              amount: 5000,
              dueDate: new Date('2024-04-25'),
              status: 'pending'
            }
          ],
          isRecurring: false,
          createdAt: new Date('2024-03-10'),
          updatedAt: new Date('2024-03-20')
        },
        {
          id: '8',
          invoiceNumber: 'INV-2024-008',
          description: 'Uniforme Escolar 2024',
          amount: 14500,
          currency: 'ARS',
          dueDate: new Date('2024-04-01'),
          status: 'pending',
          type: 'uniform',
          childId: '1',
          childName: 'Sofia García',
          invoiceUrl: '/invoices/invoice-008.pdf',
          notes: 'Incluye uniforme de educación física',
          isRecurring: false,
          createdAt: new Date('2024-03-15'),
          updatedAt: new Date('2024-03-15')
        }
      ];
      
      this.payments.set(mockPayments);
      this.filteredPayments.set(mockPayments);
      this.loading.set(false);
    }, 1000);
  }

  private loadPaymentSummary() {
    // Calculate summary from mock data
    setTimeout(() => {
      const payments = this.payments();
      const summary: PaymentSummary = {
        totalOutstanding: payments.filter(p => p.status === 'pending' || p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0),
        totalPaid: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
        overdueAmount: payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0),
        upcomingAmount: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
        totalPayments: payments.length,
        paymentsByType: payments.reduce((acc, p) => {
          acc[p.type] = (acc[p.type] || 0) + p.amount;
          return acc;
        }, {} as { [key: string]: number }),
        paymentsByStatus: payments.reduce((acc, p) => {
          acc[p.status] = (acc[p.status] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number }),
        monthlySpending: [
          { month: 'Feb 2024', amount: 69500 },
          { month: 'Mar 2024', amount: 45000 },
          { month: 'Abr 2024', amount: 32000 }
        ]
      };
      
      this.paymentSummary.set(summary);
    }, 500);
  }

  applyFilters() {
    const filters = this.filterForm.value as PaymentFilter;
    let filtered = [...this.payments()];
    
    // Search term filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(payment => 
        payment.description.toLowerCase().includes(term) ||
        payment.invoiceNumber.toLowerCase().includes(term) ||
        payment.childName.toLowerCase().includes(term) ||
        (payment.reference && payment.reference.toLowerCase().includes(term))
      );
    }
    
    // Status filter
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(payment => filters.status.includes(payment.status));
    }
    
    // Type filter
    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter(payment => filters.type.includes(payment.type));
    }
    
    // Payment method filter
    if (filters.paymentMethod && filters.paymentMethod.length > 0) {
      filtered = filtered.filter(payment => 
        payment.paymentMethod && filters.paymentMethod.includes(payment.paymentMethod)
      );
    }
    
    // Child filter
    if (filters.childId && filters.childId.length > 0) {
      filtered = filtered.filter(payment => filters.childId.includes(payment.childId));
    }
    
    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(payment => payment.dueDate >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(payment => payment.dueDate <= filters.dateTo!);
    }
    
    // Amount range filter
    if (filters.amountFrom !== null && filters.amountFrom !== undefined) {
      filtered = filtered.filter(payment => payment.amount >= filters.amountFrom!);
    }
    if (filters.amountTo !== null && filters.amountTo !== undefined) {
      filtered = filtered.filter(payment => payment.amount <= filters.amountTo!);
    }
    
    // Overdue only filter
    if (filters.showOverdueOnly) {
      filtered = filtered.filter(payment => payment.status === 'overdue');
    }
    
    // Recurring only filter
    if (filters.showRecurringOnly) {
      filtered = filtered.filter(payment => payment.isRecurring);
    }
    
    this.filteredPayments.set(filtered);
    this.updateActiveFilters(filters);
  }

  private updateActiveFilters(filters: PaymentFilter) {
    const active: string[] = [];
    
    if (filters.searchTerm) active.push(`Búsqueda: "${filters.searchTerm}"`);
    if (filters.status?.length) active.push(`Estado: ${filters.status.length} seleccionados`);
    if (filters.type?.length) active.push(`Tipo: ${filters.type.length} seleccionados`);
    if (filters.paymentMethod?.length) active.push(`Método: ${filters.paymentMethod.length} seleccionados`);
    if (filters.childId?.length) active.push(`Hijo: ${filters.childId.length} seleccionados`);
    if (filters.dateFrom) active.push(`Desde: ${filters.dateFrom.toLocaleDateString()}`);
    if (filters.dateTo) active.push(`Hasta: ${filters.dateTo.toLocaleDateString()}`);
    if (filters.amountFrom) active.push(`Monto desde: $${filters.amountFrom}`);
    if (filters.amountTo) active.push(`Monto hasta: $${filters.amountTo}`);
    if (filters.showOverdueOnly) active.push('Solo vencidos');
    if (filters.showRecurringOnly) active.push('Solo recurrentes');
    
    this.activeFilters.set(active);
  }

  clearFilters() {
    this.filterForm.reset();
    this.filteredPayments.set([...this.payments()]);
    this.activeFilters.set([]);
  }

  removeFilter(filterText: string) {
    const filters = this.filterForm.value;
    
    if (filterText.startsWith('Búsqueda:')) {
      this.filterForm.patchValue({ searchTerm: '' });
    } else if (filterText.startsWith('Estado:')) {
      this.filterForm.patchValue({ status: [] });
    } else if (filterText.startsWith('Tipo:')) {
      this.filterForm.patchValue({ type: [] });
    } else if (filterText.startsWith('Método:')) {
      this.filterForm.patchValue({ paymentMethod: [] });
    } else if (filterText.startsWith('Hijo:')) {
      this.filterForm.patchValue({ childId: [] });
    } else if (filterText.startsWith('Desde:')) {
      this.filterForm.patchValue({ dateFrom: null });
    } else if (filterText.startsWith('Hasta:')) {
      this.filterForm.patchValue({ dateTo: null });
    } else if (filterText.startsWith('Monto desde:')) {
      this.filterForm.patchValue({ amountFrom: null });
    } else if (filterText.startsWith('Monto hasta:')) {
      this.filterForm.patchValue({ amountTo: null });
    } else if (filterText === 'Solo vencidos') {
      this.filterForm.patchValue({ showOverdueOnly: false });
    } else if (filterText === 'Solo recurrentes') {
      this.filterForm.patchValue({ showRecurringOnly: false });
    }
  }

  // Payment actions
  makePayment(payment: PaymentRecord) {
    console.log('Making payment for:', payment.id);
    // Simulate payment process
    // This would integrate with actual payment gateway
  }

  downloadReceipt(payment: PaymentRecord) {
    if (payment.receiptUrl) {
      console.log('Downloading receipt:', payment.receiptUrl);
      // Implement actual download logic
    }
  }

  downloadInvoice(payment: PaymentRecord) {
    if (payment.invoiceUrl) {
      console.log('Downloading invoice:', payment.invoiceUrl);
      // Implement actual download logic
    }
  }

  setupAutoPay(payment: PaymentRecord) {
    console.log('Setting up auto pay for:', payment.id);
    // Open dialog for auto-pay setup
  }

  contactFinance() {
    console.log('Contacting finance department');
    // Open contact dialog or redirect to contact page
  }

  // Utility methods
  getStatusColor(status: string): string {
    const statusOption = this.statusOptions.find(s => s.value === status);
    return statusOption?.color || 'grey';
  }

  getStatusLabel(status: string): string {
    const statusOption = this.statusOptions.find(s => s.value === status);
    return statusOption?.label || status;
  }

  getTypeIcon(type: string): string {
    const typeOption = this.typeOptions.find(t => t.value === type);
    return typeOption?.icon || 'payment';
  }

  getTypeLabel(type: string): string {
    const typeOption = this.typeOptions.find(t => t.value === type);
    return typeOption?.label || type;
  }

  getPaymentMethodLabel(method: string): string {
    const methodOption = this.paymentMethodOptions.find(m => m.value === method);
    return methodOption?.label || method;
  }

  formatCurrency(amount: number, currency: string = 'ARS'): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  isOverdue(payment: PaymentRecord): boolean {
    return payment.status === 'overdue' || 
           (payment.status === 'pending' && payment.dueDate < new Date());
  }

  isDueSoon(payment: PaymentRecord): boolean {
    if (payment.status !== 'pending') return false;
    const daysUntilDue = Math.ceil((payment.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 7 && daysUntilDue > 0;
  }

  getUrgencyLevel(payment: PaymentRecord): 'high' | 'medium' | 'low' {
    if (this.isOverdue(payment)) return 'high';
    if (this.isDueSoon(payment)) return 'medium';
    return 'low';
  }

  toggleFilterSidebar() {
    this.showFilterSidebar.set(!this.showFilterSidebar());
  }

  setViewMode(mode: 'list' | 'cards') {
    this.viewMode.set(mode);
  }

  selectTab(index: number) {
    this.selectedTab.set(index);
  }

  exportPayments() {
    console.log('Exporting payments data');
    // Implement export functionality
  }
}