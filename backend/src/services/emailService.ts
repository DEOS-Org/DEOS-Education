import nodemailer from 'nodemailer';
import { AppError } from '../utils/AppError';
import Usuario from '../models/Usuario';
import { Op } from 'sequelize';

// Configuración del transporter
const createTransporter = () => {
  // Configuración para desarrollo (usar variables de entorno en producción)
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true para 465, false para otros puertos
    auth: {
      user: process.env.SMTP_USER || 'noreply@deos-education.com',
      pass: process.env.SMTP_PASS || 'your-app-password'
    },
    tls: {
      rejectUnauthorized: false
    }
  });
  
  return transporter;
};

// Plantillas de email
const createEmailTemplate = (
  title: string,
  message: string,
  actionUrl?: string,
  actionText?: string
) => {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #2196F3;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #2196F3;
          margin-bottom: 10px;
        }
        .title {
          color: #333;
          margin-bottom: 20px;
        }
        .message {
          color: #666;
          margin-bottom: 30px;
        }
        .action-button {
          display: inline-block;
          background-color: #2196F3;
          color: white !important;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          border-top: 1px solid #eee;
          padding-top: 20px;
          margin-top: 30px;
          text-align: center;
          color: #999;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🎓 DEOS Education</div>
          <div>Sistema de Gestión Educativa</div>
        </div>
        
        <h2 class="title">${title}</h2>
        <div class="message">${message}</div>
        
        ${actionUrl ? `
          <div style="text-align: center;">
            <a href="${actionUrl}" class="action-button">
              ${actionText || 'Ver más detalles'}
            </a>
          </div>
        ` : ''}
        
        <div class="footer">
          <p>Este es un mensaje automático del sistema DEOS Education.</p>
          <p>Por favor, no responda a este correo.</p>
          <p>&copy; 2024 DEOS Education. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ===== ENVÍO DE EMAILS =====
export const sendEmail = async (
  to: string,
  subject: string,
  htmlContent: string,
  textContent?: string
) => {
  const transporter = createTransporter();
  
  try {
    const info = await transporter.sendMail({
      from: `"DEOS Education" <${process.env.SMTP_USER || 'noreply@deos-education.com'}>`,
      to,
      subject,
      text: textContent || subject,
      html: htmlContent
    });
    
    console.log('Email enviado:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error enviando email:', error);
    throw new AppError('Error al enviar el correo electrónico', 500);
  }
};

export const sendNotificationEmail = async (
  to: string,
  userName: string,
  title: string,
  message: string,
  actionUrl?: string
) => {
  const subject = `📧 ${title} - DEOS Education`;
  const personalizedMessage = `Hola ${userName},<br><br>${message}`;
  
  const htmlContent = createEmailTemplate(
    title,
    personalizedMessage,
    actionUrl,
    'Ver en el sistema'
  );
  
  return await sendEmail(to, subject, htmlContent, `${title}\n\n${message}`);
};

// ===== EMAILS GLOBALES =====
export const sendGlobalNotificationEmail = async (
  title: string,
  message: string,
  actionUrl?: string,
  roles: string[] = []
) => {
  try {
    let usuarios: any[] = [];
    
    if (roles.length === 0) {
      // Enviar a todos los usuarios con email
      usuarios = await Usuario.findAll({
        where: {
          email: {
            [Op.not]: null,
            [Op.ne]: ''
          }
        },
        attributes: ['id', 'email', 'nombre', 'apellido']
      });
    } else {
      // Enviar solo a usuarios con roles específicos
      usuarios = await Usuario.findAll({
        where: {
          email: {
            [Op.not]: null,
            [Op.ne]: ''
          }
        },
        include: [{
          model: require('../models/Rol').default,
          where: { nombre: { [Op.in]: roles } },
          attributes: []
        }],
        attributes: ['id', 'email', 'nombre', 'apellido']
      });
    }
    
    const emailPromises = usuarios.map(usuario => 
      sendNotificationEmail(
        usuario.email,
        `${usuario.nombre} ${usuario.apellido}`,
        title,
        message,
        actionUrl
      ).catch(error => {
        console.error(`Error enviando email a ${usuario.email}:`, error.message);
        return null; // Continuar con los demás emails
      })
    );
    
    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;
    
    console.log(`Emails enviados: ${successful} exitosos, ${failed} fallidos`);
    
    return {
      total: usuarios.length,
      successful,
      failed
    };
  } catch (error) {
    console.error('Error en envío masivo de emails:', error);
    throw new AppError('Error al enviar emails masivos', 500);
  }
};

// ===== EMAILS ESPECÍFICOS DEL SISTEMA =====
export const sendAbsenceNotificationEmail = async (
  parentEmail: string,
  parentName: string,
  studentName: string,
  className: string,
  date: string
) => {
  const title = `Notificación de Ausencia - ${studentName}`;
  const message = `
    Su hijo/a <strong>${studentName}</strong> ha sido marcado como ausente en la clase de 
    <strong>${className}</strong> el día <strong>${date}</strong>.
    <br><br>
    Si considera que esto es un error, por favor comuníquese con la institución.
  `;
  
  return await sendNotificationEmail(
    parentEmail,
    parentName,
    title,
    message,
    `${process.env.FRONTEND_URL}/parent/attendance`
  );
};

export const sendGradeNotificationEmail = async (
  email: string,
  userName: string,
  studentName: string,
  subjectName: string,
  grade: number,
  isParent: boolean = false
) => {
  const title = `Nueva Calificación - ${studentName}`;
  const recipient = isParent ? `Su hijo/a ${studentName}` : 'Usted';
  const gradeColor = grade >= 7 ? '#4CAF50' : grade >= 4 ? '#FF9800' : '#F44336';
  
  const message = `
    ${recipient} ha recibido una nueva calificación en <strong>${subjectName}</strong>:
    <br><br>
    <div style="text-align: center; margin: 20px 0;">
      <span style="font-size: 24px; font-weight: bold; color: ${gradeColor};">
        ${grade} / 10
      </span>
    </div>
    <br>
    Puede ver más detalles y el progreso académico en el sistema.
  `;
  
  return await sendNotificationEmail(
    email,
    userName,
    title,
    message,
    `${process.env.FRONTEND_URL}/${isParent ? 'parent' : 'student'}/grades`
  );
};

export const sendAnnouncementEmail = async (
  email: string,
  userName: string,
  announcementTitle: string,
  announcementContent: string
) => {
  const title = `📢 ${announcementTitle}`;
  
  return await sendNotificationEmail(
    email,
    userName,
    title,
    announcementContent,
    `${process.env.FRONTEND_URL}/comunicados`
  );
};

export const sendWelcomeEmail = async (
  email: string,
  userName: string,
  temporaryPassword: string,
  userRole: string
) => {
  const title = 'Bienvenido/a a DEOS Education';
  const message = `
    Su cuenta en el sistema DEOS Education ha sido creada exitosamente.
    <br><br>
    <strong>Datos de acceso:</strong><br>
    Usuario: ${email}<br>
    Contraseña temporal: <strong>${temporaryPassword}</strong>
    <br><br>
    Por seguridad, se recomienda cambiar la contraseña en su primer acceso.
  `;
  
  return await sendNotificationEmail(
    email,
    userName,
    title,
    message,
    `${process.env.FRONTEND_URL}/auth/login`
  );
};

// ===== CONFIGURACIÓN Y TESTING =====
export const testEmailConfiguration = async () => {
  const transporter = createTransporter();
  
  try {
    await transporter.verify();
    console.log('Configuración de email verificada correctamente');
    return true;
  } catch (error) {
    console.error('Error en la configuración de email:', error);
    return false;
  }
};

export const sendTestEmail = async (to: string) => {
  const subject = 'Test de configuración - DEOS Education';
  const message = 'Este es un email de prueba para verificar la configuración del sistema de notificaciones.';
  
  const htmlContent = createEmailTemplate(
    'Test de Configuración',
    message,
    undefined,
    undefined
  );
  
  return await sendEmail(to, subject, htmlContent, message);
};