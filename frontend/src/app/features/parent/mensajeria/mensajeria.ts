import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil, BehaviorSubject } from 'rxjs';

interface Message {
  id: number;
  subject: string;
  content: string;
  sender: {
    id: number;
    name: string;
    role: string;
    avatar?: string;
  };
  recipient: {
    id: number;
    name: string;
    role: string;
  };
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  childId?: number;
  childName?: string;
  priority: 'high' | 'medium' | 'low';
  category: 'academic' | 'discipline' | 'general' | 'meeting' | 'emergency';
}

interface Teacher {
  id: number;
  name: string;
  subject: string;
  email: string;
  phone?: string;
  avatar?: string;
  childrenTaught: number[];
}

interface Child {
  id: number;
  name: string;
  grade: string;
  division: string;
}

@Component({
  selector: 'app-parent-mensajeria',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatListModule,
    MatDividerModule,
    MatChipsModule,
    MatBadgeModule,
    MatTabsModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './mensajeria.html',
  styleUrl: './mensajeria.scss'
})
export class ParentMensajeriaComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // State signals
  loading = signal(false);
  messages = signal<Message[]>([]);
  teachers = signal<Teacher[]>([]);
  children = signal<Child[]>([]);
  selectedMessage = signal<Message | null>(null);
  selectedTab = signal(0);
  
  // UI state
  showCompose = signal(false);
  searchQuery = signal('');
  selectedCategory = signal<string>('');
  selectedChild = signal<number | null>(null);
  
  // Forms
  composeForm: FormGroup;
  
  // Computed properties
  filteredMessages = computed(() => {
    let filtered = this.messages();
    
    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(msg => 
        msg.subject.toLowerCase().includes(query) ||
        msg.content.toLowerCase().includes(query) ||
        msg.sender.name.toLowerCase().includes(query)
      );
    }
    
    const category = this.selectedCategory();
    if (category) {
      filtered = filtered.filter(msg => msg.category === category);
    }
    
    const childId = this.selectedChild();
    if (childId) {
      filtered = filtered.filter(msg => msg.childId === childId);
    }
    
    return filtered.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  });
  
  unreadCount = computed(() => 
    this.messages().filter(msg => !msg.isRead).length
  );
  
  starredCount = computed(() => 
    this.messages().filter(msg => msg.isStarred).length
  );

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.composeForm = this.fb.group({
      recipientId: ['', Validators.required],
      childId: [''],
      subject: ['', Validators.required],
      content: ['', [Validators.required, Validators.minLength(10)]],
      priority: ['medium'],
      category: ['general']
    });
  }

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData() {
    this.loading.set(true);
    
    // Mock data - would come from services
    setTimeout(() => {
      this.children.set([
        { id: 1, name: 'Juan Carlos', grade: '4to Año', division: 'A' },
        { id: 2, name: 'María Elena', grade: '2do Año', division: 'B' }
      ]);

      this.teachers.set([
        {
          id: 1,
          name: 'Prof. García',
          subject: 'Matemática',
          email: 'garcia@escuela.edu',
          phone: '11-2222-3333',
          childrenTaught: [1]
        },
        {
          id: 2,
          name: 'Prof. Martínez',
          subject: 'Lengua',
          email: 'martinez@escuela.edu',
          childrenTaught: [1]
        },
        {
          id: 3,
          name: 'Prof. Silva',
          subject: 'Matemática',
          email: 'silva@escuela.edu',
          childrenTaught: [2]
        },
        {
          id: 4,
          name: 'Directora López',
          subject: 'Dirección',
          email: 'direccion@escuela.edu',
          childrenTaught: [1, 2]
        }
      ]);

      this.messages.set([
        {
          id: 1,
          subject: 'Reunión de padres - Matemática',
          content: 'Buenos días. Le escribo para coordinar una reunión para hablar sobre el progreso de Juan Carlos en matemática. Ha mostrado mucha mejora este trimestre.',
          sender: {
            id: 1,
            name: 'Prof. García',
            role: 'Profesor'
          },
          recipient: {
            id: 100,
            name: 'Padre/Madre',
            role: 'Padre'
          },
          timestamp: new Date('2024-06-25T10:30:00'),
          isRead: false,
          isStarred: false,
          hasAttachments: false,
          childId: 1,
          childName: 'Juan Carlos',
          priority: 'medium',
          category: 'academic'
        },
        {
          id: 2,
          subject: 'Ausencia justificada',
          content: 'Recibido el certificado médico por la ausencia de María Elena el día de ayer. Queda justificada.',
          sender: {
            id: 4,
            name: 'Directora López',
            role: 'Directora'
          },
          recipient: {
            id: 100,
            name: 'Padre/Madre',
            role: 'Padre'
          },
          timestamp: new Date('2024-06-24T14:15:00'),
          isRead: true,
          isStarred: true,
          hasAttachments: false,
          childId: 2,
          childName: 'María Elena',
          priority: 'low',
          category: 'general'
        },
        {
          id: 3,
          subject: 'Excelente trabajo en proyecto',
          content: 'Quería felicitarla por el excelente proyecto que presentó María Elena. Demostró mucha creatividad y dedicación.',
          sender: {
            id: 3,
            name: 'Prof. Silva',
            role: 'Profesor'
          },
          recipient: {
            id: 100,
            name: 'Padre/Madre',
            role: 'Padre'
          },
          timestamp: new Date('2024-06-23T16:45:00'),
          isRead: true,
          isStarred: false,
          hasAttachments: false,
          childId: 2,
          childName: 'María Elena',
          priority: 'medium',
          category: 'academic'
        }
      ]);

      this.loading.set(false);
    }, 1000);
  }

  // Message actions
  selectMessage(message: Message) {
    this.selectedMessage.set(message);
    if (!message.isRead) {
      this.markAsRead(message);
    }
  }

  markAsRead(message: Message) {
    const messages = this.messages();
    const index = messages.findIndex(m => m.id === message.id);
    if (index !== -1) {
      messages[index].isRead = true;
      this.messages.set([...messages]);
    }
  }

  toggleStar(message: Message) {
    const messages = this.messages();
    const index = messages.findIndex(m => m.id === message.id);
    if (index !== -1) {
      messages[index].isStarred = !messages[index].isStarred;
      this.messages.set([...messages]);
    }
  }

  deleteMessage(message: Message) {
    if (confirm('¿Está seguro de que desea eliminar este mensaje?')) {
      const messages = this.messages().filter(m => m.id !== message.id);
      this.messages.set(messages);
      if (this.selectedMessage()?.id === message.id) {
        this.selectedMessage.set(null);
      }
      this.snackBar.open('Mensaje eliminado', 'Cerrar', { duration: 3000 });
    }
  }

  // Compose actions
  openCompose(teacherId?: number, childId?: number) {
    this.showCompose.set(true);
    if (teacherId) {
      this.composeForm.patchValue({ recipientId: teacherId });
    }
    if (childId) {
      this.composeForm.patchValue({ childId });
    }
  }

  closeCompose() {
    this.showCompose.set(false);
    this.composeForm.reset({
      priority: 'medium',
      category: 'general'
    });
  }

  sendMessage() {
    if (this.composeForm.valid) {
      const formValue = this.composeForm.value;
      const teacher = this.teachers().find(t => t.id === formValue.recipientId);
      const child = this.children().find(c => c.id === formValue.childId);
      
      const newMessage: Message = {
        id: Date.now(),
        subject: formValue.subject,
        content: formValue.content,
        sender: {
          id: 100,
          name: 'Padre/Madre',
          role: 'Padre'
        },
        recipient: {
          id: teacher?.id || 0,
          name: teacher?.name || '',
          role: 'Profesor'
        },
        timestamp: new Date(),
        isRead: true,
        isStarred: false,
        hasAttachments: false,
        childId: child?.id,
        childName: child?.name,
        priority: formValue.priority,
        category: formValue.category
      };

      const messages = [newMessage, ...this.messages()];
      this.messages.set(messages);
      
      this.closeCompose();
      this.snackBar.open('Mensaje enviado exitosamente', 'Cerrar', { duration: 3000 });
    }
  }

  replyToMessage(message: Message) {
    this.openCompose(message.sender.id, message.childId);
    this.composeForm.patchValue({
      subject: `Re: ${message.subject}`,
      category: message.category
    });
  }

  // Filter actions
  filterByCategory(category: string) {
    this.selectedCategory.set(category === this.selectedCategory() ? '' : category);
  }

  filterByChild(childId: number) {
    this.selectedChild.set(childId === this.selectedChild() ? null : childId);
  }

  clearFilters() {
    this.selectedCategory.set('');
    this.selectedChild.set(null);
    this.searchQuery.set('');
  }

  // Utility methods
  getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'high': return 'priority_high';
      case 'low': return 'low_priority';
      default: return 'remove';
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'warn';
      case 'low': return 'basic';
      default: return 'primary';
    }
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'academic': return 'school';
      case 'discipline': return 'warning';
      case 'meeting': return 'event';
      case 'emergency': return 'emergency';
      default: return 'message';
    }
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    }
  }

  getTeachersByChild(childId: number): Teacher[] {
    return this.teachers().filter(teacher => 
      teacher.childrenTaught.includes(childId)
    );
  }
}