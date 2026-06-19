/* eslint-disable */
// AUTO-GENERATED — DO NOT EDIT
// Run migrations to regenerate.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      _prisma_migrations: {
        Row: {
          applied_steps_count: number
          checksum: string
          finished_at: string | null
          id: string
          logs: string | null
          migration_name: string
          rolled_back_at: string | null
          started_at: string
        }
        Insert: {
          applied_steps_count?: number
          checksum: string
          finished_at?: string | null
          id: string
          logs?: string | null
          migration_name: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Update: {
          applied_steps_count?: number
          checksum?: string
          finished_at?: string | null
          id?: string
          logs?: string | null
          migration_name?: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Relationships: []
      }
      Allergy: {
        Row: {
          businessId: string
          createdAt: string
          deletedAt: string | null
          id: string
          name: string
          notes: string | null
          patientId: string
          reaction: string | null
          severity: string
          updatedAt: string
        }
        Insert: {
          businessId: string
          createdAt?: string
          deletedAt?: string | null
          id: string
          name: string
          notes?: string | null
          patientId: string
          reaction?: string | null
          severity?: string
          updatedAt: string
        }
        Update: {
          businessId?: string
          createdAt?: string
          deletedAt?: string | null
          id?: string
          name?: string
          notes?: string | null
          patientId?: string
          reaction?: string | null
          severity?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Allergy_businessId_fkey"
            columns: ["businessId"]
            isOneToOne: false
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Allergy_patientId_fkey"
            columns: ["patientId"]
            isOneToOne: false
            referencedRelation: "Patient"
            referencedColumns: ["id"]
          },
        ]
      }
      Appointment: {
        Row: {
          businessId: string
          clientUserId: string | null
          createdAt: string
          date: string
          deletedAt: string | null
          endTime: string
          id: string
          locationId: string | null
          notes: string | null
          patientId: string
          price: number | null
          serviceId: string
          source: Database["public"]["Enums"]["AppointmentSource"]
          staffId: string | null
          startTime: string
          status: Database["public"]["Enums"]["AppointmentStatus"]
          updatedAt: string
        }
        Insert: {
          businessId: string
          clientUserId?: string | null
          createdAt?: string
          date: string
          deletedAt?: string | null
          endTime: string
          id: string
          locationId?: string | null
          notes?: string | null
          patientId: string
          price?: number | null
          serviceId: string
          source?: Database["public"]["Enums"]["AppointmentSource"]
          staffId?: string | null
          startTime: string
          status?: Database["public"]["Enums"]["AppointmentStatus"]
          updatedAt: string
        }
        Update: {
          businessId?: string
          clientUserId?: string | null
          createdAt?: string
          date?: string
          deletedAt?: string | null
          endTime?: string
          id?: string
          locationId?: string | null
          notes?: string | null
          patientId?: string
          price?: number | null
          serviceId?: string
          source?: Database["public"]["Enums"]["AppointmentSource"]
          staffId?: string | null
          startTime?: string
          status?: Database["public"]["Enums"]["AppointmentStatus"]
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Appointment_businessId_fkey"
            columns: ["businessId"]
            isOneToOne: false
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Appointment_clientUserId_fkey"
            columns: ["clientUserId"]
            isOneToOne: false
            referencedRelation: "ClientUser"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Appointment_locationId_fkey"
            columns: ["locationId"]
            isOneToOne: false
            referencedRelation: "Location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Appointment_patientId_fkey"
            columns: ["patientId"]
            isOneToOne: false
            referencedRelation: "Patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Appointment_serviceId_fkey"
            columns: ["serviceId"]
            isOneToOne: false
            referencedRelation: "Service"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Appointment_staffId_fkey"
            columns: ["staffId"]
            isOneToOne: false
            referencedRelation: "TeamMember"
            referencedColumns: ["id"]
          },
        ]
      }
      Business: {
        Row: {
          address: string | null
          autoConfirmClientAppointments: boolean
          city: string | null
          createdAt: string
          currency: string
          deletedAt: string | null
          description: string | null
          email: string | null
          id: string
          isActive: boolean
          locationLat: number | null
          locationLng: number | null
          logoUrl: string | null
          name: string
          ownerUserId: string
          phone: string | null
          primaryColor: string
          slug: string
          timezone: string
          updatedAt: string
        }
        Insert: {
          address?: string | null
          autoConfirmClientAppointments?: boolean
          city?: string | null
          createdAt?: string
          currency?: string
          deletedAt?: string | null
          description?: string | null
          email?: string | null
          id: string
          isActive?: boolean
          locationLat?: number | null
          locationLng?: number | null
          logoUrl?: string | null
          name: string
          ownerUserId: string
          phone?: string | null
          primaryColor?: string
          slug: string
          timezone?: string
          updatedAt: string
        }
        Update: {
          address?: string | null
          autoConfirmClientAppointments?: boolean
          city?: string | null
          createdAt?: string
          currency?: string
          deletedAt?: string | null
          description?: string | null
          email?: string | null
          id?: string
          isActive?: boolean
          locationLat?: number | null
          locationLng?: number | null
          logoUrl?: string | null
          name?: string
          ownerUserId?: string
          phone?: string | null
          primaryColor?: string
          slug?: string
          timezone?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Business_ownerUserId_fkey"
            columns: ["ownerUserId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      ClientNotification: {
        Row: {
          appointmentId: string | null
          businessId: string | null
          clientUserId: string
          createdAt: string
          deletedAt: string | null
          id: string
          isRead: boolean
          link: string | null
          message: string
          metadata: Json | null
          readAt: string | null
          title: string
          type: Database["public"]["Enums"]["ClientNotificationType"]
        }
        Insert: {
          appointmentId?: string | null
          businessId?: string | null
          clientUserId: string
          createdAt?: string
          deletedAt?: string | null
          id: string
          isRead?: boolean
          link?: string | null
          message: string
          metadata?: Json | null
          readAt?: string | null
          title: string
          type: Database["public"]["Enums"]["ClientNotificationType"]
        }
        Update: {
          appointmentId?: string | null
          businessId?: string | null
          clientUserId?: string
          createdAt?: string
          deletedAt?: string | null
          id?: string
          isRead?: boolean
          link?: string | null
          message?: string
          metadata?: Json | null
          readAt?: string | null
          title?: string
          type?: Database["public"]["Enums"]["ClientNotificationType"]
        }
        Relationships: [
          {
            foreignKeyName: "ClientNotification_appointmentId_fkey"
            columns: ["appointmentId"]
            isOneToOne: false
            referencedRelation: "Appointment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ClientNotification_businessId_fkey"
            columns: ["businessId"]
            isOneToOne: false
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ClientNotification_clientUserId_fkey"
            columns: ["clientUserId"]
            isOneToOne: false
            referencedRelation: "ClientUser"
            referencedColumns: ["id"]
          },
        ]
      }
      ClientUser: {
        Row: {
          address: string | null
          authUserId: string | null
          city: string | null
          createdAt: string
          deletedAt: string | null
          email: string | null
          fullName: string
          id: string
          locationLat: number | null
          locationLng: number | null
          phone: string | null
          updatedAt: string
        }
        Insert: {
          address?: string | null
          authUserId?: string | null
          city?: string | null
          createdAt?: string
          deletedAt?: string | null
          email?: string | null
          fullName: string
          id: string
          locationLat?: number | null
          locationLng?: number | null
          phone?: string | null
          updatedAt: string
        }
        Update: {
          address?: string | null
          authUserId?: string | null
          city?: string | null
          createdAt?: string
          deletedAt?: string | null
          email?: string | null
          fullName?: string
          id?: string
          locationLat?: number | null
          locationLng?: number | null
          phone?: string | null
          updatedAt?: string
        }
        Relationships: []
      }
      Conversation: {
        Row: {
          businessId: string
          createdAt: string
          deletedAt: string | null
          directKey: string | null
          id: string
          isGroup: boolean
          lastMessageAt: string | null
          title: string | null
          updatedAt: string
        }
        Insert: {
          businessId: string
          createdAt?: string
          deletedAt?: string | null
          directKey?: string | null
          id: string
          isGroup?: boolean
          lastMessageAt?: string | null
          title?: string | null
          updatedAt: string
        }
        Update: {
          businessId?: string
          createdAt?: string
          deletedAt?: string | null
          directKey?: string | null
          id?: string
          isGroup?: boolean
          lastMessageAt?: string | null
          title?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Conversation_businessId_fkey"
            columns: ["businessId"]
            isOneToOne: false
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
        ]
      }
      ConversationParticipant: {
        Row: {
          conversationId: string
          deletedAt: string | null
          id: string
          isActive: boolean
          joinedAt: string
          lastReadAt: string | null
          userId: string
        }
        Insert: {
          conversationId: string
          deletedAt?: string | null
          id: string
          isActive?: boolean
          joinedAt?: string
          lastReadAt?: string | null
          userId: string
        }
        Update: {
          conversationId?: string
          deletedAt?: string | null
          id?: string
          isActive?: boolean
          joinedAt?: string
          lastReadAt?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "ConversationParticipant_conversationId_fkey"
            columns: ["conversationId"]
            isOneToOne: false
            referencedRelation: "Conversation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ConversationParticipant_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      LabResult: {
        Row: {
          businessId: string
          createdAt: string
          deletedAt: string | null
          description: string | null
          fileUrl: string | null
          id: string
          labName: string | null
          notes: string | null
          patientId: string
          resultDate: string
          title: string
          updatedAt: string
        }
        Insert: {
          businessId: string
          createdAt?: string
          deletedAt?: string | null
          description?: string | null
          fileUrl?: string | null
          id: string
          labName?: string | null
          notes?: string | null
          patientId: string
          resultDate: string
          title: string
          updatedAt: string
        }
        Update: {
          businessId?: string
          createdAt?: string
          deletedAt?: string | null
          description?: string | null
          fileUrl?: string | null
          id?: string
          labName?: string | null
          notes?: string | null
          patientId?: string
          resultDate?: string
          title?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "LabResult_businessId_fkey"
            columns: ["businessId"]
            isOneToOne: false
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "LabResult_patientId_fkey"
            columns: ["patientId"]
            isOneToOne: false
            referencedRelation: "Patient"
            referencedColumns: ["id"]
          },
        ]
      }
      Location: {
        Row: {
          address: string | null
          businessId: string
          city: string | null
          createdAt: string
          deletedAt: string | null
          id: string
          isActive: boolean
          name: string
          phone: string | null
          sortOrder: number
          updatedAt: string
        }
        Insert: {
          address?: string | null
          businessId: string
          city?: string | null
          createdAt?: string
          deletedAt?: string | null
          id: string
          isActive?: boolean
          name: string
          phone?: string | null
          sortOrder?: number
          updatedAt: string
        }
        Update: {
          address?: string | null
          businessId?: string
          city?: string | null
          createdAt?: string
          deletedAt?: string | null
          id?: string
          isActive?: boolean
          name?: string
          phone?: string | null
          sortOrder?: number
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Location_businessId_fkey"
            columns: ["businessId"]
            isOneToOne: false
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
        ]
      }
      Medication: {
        Row: {
          active: boolean
          businessId: string
          createdAt: string
          deletedAt: string | null
          dosage: string | null
          endDate: string | null
          frequency: string | null
          id: string
          name: string
          notes: string | null
          patientId: string
          startDate: string | null
          updatedAt: string
        }
        Insert: {
          active?: boolean
          businessId: string
          createdAt?: string
          deletedAt?: string | null
          dosage?: string | null
          endDate?: string | null
          frequency?: string | null
          id: string
          name: string
          notes?: string | null
          patientId: string
          startDate?: string | null
          updatedAt: string
        }
        Update: {
          active?: boolean
          businessId?: string
          createdAt?: string
          deletedAt?: string | null
          dosage?: string | null
          endDate?: string | null
          frequency?: string | null
          id?: string
          name?: string
          notes?: string | null
          patientId?: string
          startDate?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Medication_businessId_fkey"
            columns: ["businessId"]
            isOneToOne: false
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Medication_patientId_fkey"
            columns: ["patientId"]
            isOneToOne: false
            referencedRelation: "Patient"
            referencedColumns: ["id"]
          },
        ]
      }
      Message: {
        Row: {
          body: string
          conversationId: string
          createdAt: string
          deletedAt: string | null
          editedAt: string | null
          id: string
          senderUserId: string
        }
        Insert: {
          body?: string
          conversationId: string
          createdAt?: string
          deletedAt?: string | null
          editedAt?: string | null
          id: string
          senderUserId: string
        }
        Update: {
          body?: string
          conversationId?: string
          createdAt?: string
          deletedAt?: string | null
          editedAt?: string | null
          id?: string
          senderUserId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Message_conversationId_fkey"
            columns: ["conversationId"]
            isOneToOne: false
            referencedRelation: "Conversation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Message_senderUserId_fkey"
            columns: ["senderUserId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      MessageAttachment: {
        Row: {
          createdAt: string
          deletedAt: string | null
          fileName: string
          fileSize: number
          fileType: string
          fileUrl: string
          id: string
          messageId: string
          storageKey: string
        }
        Insert: {
          createdAt?: string
          deletedAt?: string | null
          fileName: string
          fileSize: number
          fileType: string
          fileUrl: string
          id: string
          messageId: string
          storageKey: string
        }
        Update: {
          createdAt?: string
          deletedAt?: string | null
          fileName?: string
          fileSize?: number
          fileType?: string
          fileUrl?: string
          id?: string
          messageId?: string
          storageKey?: string
        }
        Relationships: [
          {
            foreignKeyName: "MessageAttachment_messageId_fkey"
            columns: ["messageId"]
            isOneToOne: false
            referencedRelation: "Message"
            referencedColumns: ["id"]
          },
        ]
      }
      MessageReaction: {
        Row: {
          createdAt: string
          deletedAt: string | null
          emoji: string
          id: string
          messageId: string
          userId: string
        }
        Insert: {
          createdAt?: string
          deletedAt?: string | null
          emoji: string
          id: string
          messageId: string
          userId: string
        }
        Update: {
          createdAt?: string
          deletedAt?: string | null
          emoji?: string
          id?: string
          messageId?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "MessageReaction_messageId_fkey"
            columns: ["messageId"]
            isOneToOne: false
            referencedRelation: "Message"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "MessageReaction_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Notification: {
        Row: {
          actionRequired: boolean
          actorUserId: string | null
          archivedAt: string | null
          businessId: string
          createdAt: string
          deletedAt: string | null
          entityId: string | null
          entityType: string | null
          id: string
          isRead: boolean
          link: string | null
          message: string
          metadata: Json | null
          priority: Database["public"]["Enums"]["NotificationPriority"]
          readAt: string | null
          subtype: string | null
          title: string
          type: Database["public"]["Enums"]["NotificationType"]
          userId: string | null
        }
        Insert: {
          actionRequired?: boolean
          actorUserId?: string | null
          archivedAt?: string | null
          businessId: string
          createdAt?: string
          deletedAt?: string | null
          entityId?: string | null
          entityType?: string | null
          id: string
          isRead?: boolean
          link?: string | null
          message: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["NotificationPriority"]
          readAt?: string | null
          subtype?: string | null
          title: string
          type?: Database["public"]["Enums"]["NotificationType"]
          userId?: string | null
        }
        Update: {
          actionRequired?: boolean
          actorUserId?: string | null
          archivedAt?: string | null
          businessId?: string
          createdAt?: string
          deletedAt?: string | null
          entityId?: string | null
          entityType?: string | null
          id?: string
          isRead?: boolean
          link?: string | null
          message?: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["NotificationPriority"]
          readAt?: string | null
          subtype?: string | null
          title?: string
          type?: Database["public"]["Enums"]["NotificationType"]
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Notification_actorUserId_fkey"
            columns: ["actorUserId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Notification_businessId_fkey"
            columns: ["businessId"]
            isOneToOne: false
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Notification_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      NotificationAction: {
        Row: {
          actionType: Database["public"]["Enums"]["NotificationActionType"]
          completedAt: string | null
          completedBy: string | null
          createdAt: string
          deletedAt: string | null
          id: string
          label: string
          notificationId: string
          payload: Json | null
          status: Database["public"]["Enums"]["NotificationActionStatus"]
        }
        Insert: {
          actionType: Database["public"]["Enums"]["NotificationActionType"]
          completedAt?: string | null
          completedBy?: string | null
          createdAt?: string
          deletedAt?: string | null
          id: string
          label: string
          notificationId: string
          payload?: Json | null
          status?: Database["public"]["Enums"]["NotificationActionStatus"]
        }
        Update: {
          actionType?: Database["public"]["Enums"]["NotificationActionType"]
          completedAt?: string | null
          completedBy?: string | null
          createdAt?: string
          deletedAt?: string | null
          id?: string
          label?: string
          notificationId?: string
          payload?: Json | null
          status?: Database["public"]["Enums"]["NotificationActionStatus"]
        }
        Relationships: [
          {
            foreignKeyName: "NotificationAction_notificationId_fkey"
            columns: ["notificationId"]
            isOneToOne: false
            referencedRelation: "Notification"
            referencedColumns: ["id"]
          },
        ]
      }
      Patient: {
        Row: {
          address: string | null
          aiSuggestions: Json | null
          assignedDoctorId: string | null
          birthDate: string | null
          bloodType: string | null
          businessId: string
          chronicDiseases: string | null
          city: string | null
          createdAt: string
          currentTreatment: string | null
          deletedAt: string | null
          email: string | null
          emergencyContactName: string | null
          emergencyContactPhone: string | null
          familyHistory: string | null
          fullName: string
          gender: string | null
          id: string
          identityNumber: string | null
          insuranceProvider: string | null
          isArchived: boolean
          lastDiagnosis: string | null
          occupation: string | null
          patientNumber: string
          patientStory: string | null
          phone: string
          riskNote: string | null
          summary: string | null
          tags: string[] | null
          updatedAt: string
        }
        Insert: {
          address?: string | null
          aiSuggestions?: Json | null
          assignedDoctorId?: string | null
          birthDate?: string | null
          bloodType?: string | null
          businessId: string
          chronicDiseases?: string | null
          city?: string | null
          createdAt?: string
          currentTreatment?: string | null
          deletedAt?: string | null
          email?: string | null
          emergencyContactName?: string | null
          emergencyContactPhone?: string | null
          familyHistory?: string | null
          fullName: string
          gender?: string | null
          id: string
          identityNumber?: string | null
          insuranceProvider?: string | null
          isArchived?: boolean
          lastDiagnosis?: string | null
          occupation?: string | null
          patientNumber: string
          patientStory?: string | null
          phone: string
          riskNote?: string | null
          summary?: string | null
          tags?: string[] | null
          updatedAt: string
        }
        Update: {
          address?: string | null
          aiSuggestions?: Json | null
          assignedDoctorId?: string | null
          birthDate?: string | null
          bloodType?: string | null
          businessId?: string
          chronicDiseases?: string | null
          city?: string | null
          createdAt?: string
          currentTreatment?: string | null
          deletedAt?: string | null
          email?: string | null
          emergencyContactName?: string | null
          emergencyContactPhone?: string | null
          familyHistory?: string | null
          fullName?: string
          gender?: string | null
          id?: string
          identityNumber?: string | null
          insuranceProvider?: string | null
          isArchived?: boolean
          lastDiagnosis?: string | null
          occupation?: string | null
          patientNumber?: string
          patientStory?: string | null
          phone?: string
          riskNote?: string | null
          summary?: string | null
          tags?: string[] | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Patient_assignedDoctorId_fkey"
            columns: ["assignedDoctorId"]
            isOneToOne: false
            referencedRelation: "TeamMember"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Patient_businessId_fkey"
            columns: ["businessId"]
            isOneToOne: false
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
        ]
      }
      PatientFile: {
        Row: {
          businessId: string
          category: Database["public"]["Enums"]["FileCategory"]
          deletedAt: string | null
          description: string | null
          fileName: string
          fileSize: number | null
          fileType: string
          fileUrl: string
          id: string
          patientId: string
          storageKey: string
          uploadedAt: string
          uploadedBy: string | null
        }
        Insert: {
          businessId: string
          category?: Database["public"]["Enums"]["FileCategory"]
          deletedAt?: string | null
          description?: string | null
          fileName: string
          fileSize?: number | null
          fileType: string
          fileUrl: string
          id: string
          patientId: string
          storageKey: string
          uploadedAt?: string
          uploadedBy?: string | null
        }
        Update: {
          businessId?: string
          category?: Database["public"]["Enums"]["FileCategory"]
          deletedAt?: string | null
          description?: string | null
          fileName?: string
          fileSize?: number | null
          fileType?: string
          fileUrl?: string
          id?: string
          patientId?: string
          storageKey?: string
          uploadedAt?: string
          uploadedBy?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "PatientFile_businessId_fkey"
            columns: ["businessId"]
            isOneToOne: false
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "PatientFile_patientId_fkey"
            columns: ["patientId"]
            isOneToOne: false
            referencedRelation: "Patient"
            referencedColumns: ["id"]
          },
        ]
      }
      PatientNote: {
        Row: {
          businessId: string
          createdAt: string
          createdBy: string
          createdByUserId: string | null
          deletedAt: string | null
          id: string
          isPinned: boolean
          note: string
          patientId: string
          title: string
          updatedAt: string
        }
        Insert: {
          businessId: string
          createdAt?: string
          createdBy: string
          createdByUserId?: string | null
          deletedAt?: string | null
          id: string
          isPinned?: boolean
          note: string
          patientId: string
          title: string
          updatedAt: string
        }
        Update: {
          businessId?: string
          createdAt?: string
          createdBy?: string
          createdByUserId?: string | null
          deletedAt?: string | null
          id?: string
          isPinned?: boolean
          note?: string
          patientId?: string
          title?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "PatientNote_businessId_fkey"
            columns: ["businessId"]
            isOneToOne: false
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "PatientNote_createdByUserId_fkey"
            columns: ["createdByUserId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "PatientNote_patientId_fkey"
            columns: ["patientId"]
            isOneToOne: false
            referencedRelation: "Patient"
            referencedColumns: ["id"]
          },
        ]
      }
      PushSubscription: {
        Row: {
          auth: string
          businessId: string
          createdAt: string
          deletedAt: string | null
          endpoint: string
          id: string
          lastUsedAt: string | null
          p256dh: string
          userAgent: string | null
          userId: string
        }
        Insert: {
          auth: string
          businessId: string
          createdAt?: string
          deletedAt?: string | null
          endpoint: string
          id: string
          lastUsedAt?: string | null
          p256dh: string
          userAgent?: string | null
          userId: string
        }
        Update: {
          auth?: string
          businessId?: string
          createdAt?: string
          deletedAt?: string | null
          endpoint?: string
          id?: string
          lastUsedAt?: string | null
          p256dh?: string
          userAgent?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "PushSubscription_businessId_fkey"
            columns: ["businessId"]
            isOneToOne: false
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "PushSubscription_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Reminder: {
        Row: {
          businessId: string
          createdAt: string
          deletedAt: string | null
          dueAt: string | null
          id: string
          isDone: boolean
          note: string | null
          priority: Database["public"]["Enums"]["ReminderPriority"]
          title: string
          updatedAt: string
          userId: string
        }
        Insert: {
          businessId: string
          createdAt?: string
          deletedAt?: string | null
          dueAt?: string | null
          id: string
          isDone?: boolean
          note?: string | null
          priority?: Database["public"]["Enums"]["ReminderPriority"]
          title: string
          updatedAt: string
          userId: string
        }
        Update: {
          businessId?: string
          createdAt?: string
          deletedAt?: string | null
          dueAt?: string | null
          id?: string
          isDone?: boolean
          note?: string | null
          priority?: Database["public"]["Enums"]["ReminderPriority"]
          title?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Reminder_businessId_fkey"
            columns: ["businessId"]
            isOneToOne: false
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Reminder_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Review: {
        Row: {
          appointmentId: string
          businessId: string
          clientUserId: string
          comment: string | null
          communication: number | null
          createdAt: string
          deletedAt: string | null
          id: string
          patientId: string | null
          rating: number
          serviceId: string | null
          serviceQuality: number | null
          staffId: string | null
          updatedAt: string
          waitingTime: number | null
        }
        Insert: {
          appointmentId: string
          businessId: string
          clientUserId: string
          comment?: string | null
          communication?: number | null
          createdAt?: string
          deletedAt?: string | null
          id: string
          patientId?: string | null
          rating: number
          serviceId?: string | null
          serviceQuality?: number | null
          staffId?: string | null
          updatedAt: string
          waitingTime?: number | null
        }
        Update: {
          appointmentId?: string
          businessId?: string
          clientUserId?: string
          comment?: string | null
          communication?: number | null
          createdAt?: string
          deletedAt?: string | null
          id?: string
          patientId?: string | null
          rating?: number
          serviceId?: string | null
          serviceQuality?: number | null
          staffId?: string | null
          updatedAt?: string
          waitingTime?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "Review_appointmentId_fkey"
            columns: ["appointmentId"]
            isOneToOne: false
            referencedRelation: "Appointment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Review_businessId_fkey"
            columns: ["businessId"]
            isOneToOne: false
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Review_clientUserId_fkey"
            columns: ["clientUserId"]
            isOneToOne: false
            referencedRelation: "ClientUser"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Review_serviceId_fkey"
            columns: ["serviceId"]
            isOneToOne: false
            referencedRelation: "Service"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Review_staffId_fkey"
            columns: ["staffId"]
            isOneToOne: false
            referencedRelation: "TeamMember"
            referencedColumns: ["id"]
          },
        ]
      }
      Service: {
        Row: {
          businessId: string
          category: string | null
          color: string
          createdAt: string
          currency: string
          deletedAt: string | null
          description: string | null
          durationMin: number
          id: string
          isActive: boolean
          name: string
          price: number
          updatedAt: string
        }
        Insert: {
          businessId: string
          category?: string | null
          color?: string
          createdAt?: string
          currency?: string
          deletedAt?: string | null
          description?: string | null
          durationMin?: number
          id: string
          isActive?: boolean
          name: string
          price?: number
          updatedAt: string
        }
        Update: {
          businessId?: string
          category?: string | null
          color?: string
          createdAt?: string
          currency?: string
          deletedAt?: string | null
          description?: string | null
          durationMin?: number
          id?: string
          isActive?: boolean
          name?: string
          price?: number
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Service_businessId_fkey"
            columns: ["businessId"]
            isOneToOne: false
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
        ]
      }
      ServiceStaff: {
        Row: {
          businessId: string
          createdAt: string
          deletedAt: string | null
          id: string
          isActive: boolean
          serviceId: string
          staffId: string
          updatedAt: string
        }
        Insert: {
          businessId: string
          createdAt?: string
          deletedAt?: string | null
          id: string
          isActive?: boolean
          serviceId: string
          staffId: string
          updatedAt: string
        }
        Update: {
          businessId?: string
          createdAt?: string
          deletedAt?: string | null
          id?: string
          isActive?: boolean
          serviceId?: string
          staffId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "ServiceStaff_businessId_fkey"
            columns: ["businessId"]
            isOneToOne: false
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ServiceStaff_serviceId_fkey"
            columns: ["serviceId"]
            isOneToOne: false
            referencedRelation: "Service"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ServiceStaff_staffId_fkey"
            columns: ["staffId"]
            isOneToOne: false
            referencedRelation: "TeamMember"
            referencedColumns: ["id"]
          },
        ]
      }
      TeamMember: {
        Row: {
          bio: string | null
          businessId: string
          color: string
          createdAt: string
          deletedAt: string | null
          email: string
          fullName: string
          id: string
          isActive: boolean
          isBookable: boolean
          lastSeenAt: string | null
          permissions: string[] | null
          phone: string | null
          role: Database["public"]["Enums"]["TeamRole"]
          specialty: string | null
          updatedAt: string
          userId: string | null
        }
        Insert: {
          bio?: string | null
          businessId: string
          color?: string
          createdAt?: string
          deletedAt?: string | null
          email: string
          fullName: string
          id: string
          isActive?: boolean
          isBookable?: boolean
          lastSeenAt?: string | null
          permissions?: string[] | null
          phone?: string | null
          role?: Database["public"]["Enums"]["TeamRole"]
          specialty?: string | null
          updatedAt: string
          userId?: string | null
        }
        Update: {
          bio?: string | null
          businessId?: string
          color?: string
          createdAt?: string
          deletedAt?: string | null
          email?: string
          fullName?: string
          id?: string
          isActive?: boolean
          isBookable?: boolean
          lastSeenAt?: string | null
          permissions?: string[] | null
          phone?: string | null
          role?: Database["public"]["Enums"]["TeamRole"]
          specialty?: string | null
          updatedAt?: string
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "TeamMember_businessId_fkey"
            columns: ["businessId"]
            isOneToOne: false
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "TeamMember_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      TeamMemberAvailability: {
        Row: {
          businessId: string
          createdAt: string
          deletedAt: string | null
          endTime: string
          id: string
          isActive: boolean
          locationId: string | null
          slotIntervalMin: number
          staffId: string
          startTime: string
          updatedAt: string
          weekday: number
        }
        Insert: {
          businessId: string
          createdAt?: string
          deletedAt?: string | null
          endTime: string
          id: string
          isActive?: boolean
          locationId?: string | null
          slotIntervalMin?: number
          staffId: string
          startTime: string
          updatedAt: string
          weekday: number
        }
        Update: {
          businessId?: string
          createdAt?: string
          deletedAt?: string | null
          endTime?: string
          id?: string
          isActive?: boolean
          locationId?: string | null
          slotIntervalMin?: number
          staffId?: string
          startTime?: string
          updatedAt?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "TeamMemberAvailability_businessId_fkey"
            columns: ["businessId"]
            isOneToOne: false
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "TeamMemberAvailability_locationId_fkey"
            columns: ["locationId"]
            isOneToOne: false
            referencedRelation: "Location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "TeamMemberAvailability_staffId_fkey"
            columns: ["staffId"]
            isOneToOne: false
            referencedRelation: "TeamMember"
            referencedColumns: ["id"]
          },
        ]
      }
      TeamMemberUnavailableBlock: {
        Row: {
          businessId: string
          createdAt: string
          date: string
          deletedAt: string | null
          endTime: string
          id: string
          locationId: string | null
          reason: string | null
          staffId: string
          startTime: string
          updatedAt: string
        }
        Insert: {
          businessId: string
          createdAt?: string
          date: string
          deletedAt?: string | null
          endTime: string
          id: string
          locationId?: string | null
          reason?: string | null
          staffId: string
          startTime: string
          updatedAt: string
        }
        Update: {
          businessId?: string
          createdAt?: string
          date?: string
          deletedAt?: string | null
          endTime?: string
          id?: string
          locationId?: string | null
          reason?: string | null
          staffId?: string
          startTime?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "TeamMemberUnavailableBlock_businessId_fkey"
            columns: ["businessId"]
            isOneToOne: false
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "TeamMemberUnavailableBlock_locationId_fkey"
            columns: ["locationId"]
            isOneToOne: false
            referencedRelation: "Location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "TeamMemberUnavailableBlock_staffId_fkey"
            columns: ["staffId"]
            isOneToOne: false
            referencedRelation: "TeamMember"
            referencedColumns: ["id"]
          },
        ]
      }
      TimelineEvent: {
        Row: {
          actorId: string | null
          actorName: string | null
          businessId: string
          createdAt: string
          deletedAt: string | null
          description: string | null
          id: string
          metadata: Json | null
          patientId: string | null
          title: string
          type: Database["public"]["Enums"]["TimelineEventType"]
        }
        Insert: {
          actorId?: string | null
          actorName?: string | null
          businessId: string
          createdAt?: string
          deletedAt?: string | null
          description?: string | null
          id: string
          metadata?: Json | null
          patientId?: string | null
          title: string
          type: Database["public"]["Enums"]["TimelineEventType"]
        }
        Update: {
          actorId?: string | null
          actorName?: string | null
          businessId?: string
          createdAt?: string
          deletedAt?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          patientId?: string | null
          title?: string
          type?: Database["public"]["Enums"]["TimelineEventType"]
        }
        Relationships: [
          {
            foreignKeyName: "TimelineEvent_businessId_fkey"
            columns: ["businessId"]
            isOneToOne: false
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "TimelineEvent_patientId_fkey"
            columns: ["patientId"]
            isOneToOne: false
            referencedRelation: "Patient"
            referencedColumns: ["id"]
          },
        ]
      }
      Treatment: {
        Row: {
          businessId: string
          cost: number | null
          createdAt: string
          deletedAt: string | null
          description: string | null
          doctorName: string | null
          endDate: string | null
          id: string
          notes: string | null
          patientId: string
          startDate: string | null
          status: Database["public"]["Enums"]["TreatmentStatus"]
          title: string
          updatedAt: string
        }
        Insert: {
          businessId: string
          cost?: number | null
          createdAt?: string
          deletedAt?: string | null
          description?: string | null
          doctorName?: string | null
          endDate?: string | null
          id: string
          notes?: string | null
          patientId: string
          startDate?: string | null
          status?: Database["public"]["Enums"]["TreatmentStatus"]
          title: string
          updatedAt: string
        }
        Update: {
          businessId?: string
          cost?: number | null
          createdAt?: string
          deletedAt?: string | null
          description?: string | null
          doctorName?: string | null
          endDate?: string | null
          id?: string
          notes?: string | null
          patientId?: string
          startDate?: string | null
          status?: Database["public"]["Enums"]["TreatmentStatus"]
          title?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Treatment_businessId_fkey"
            columns: ["businessId"]
            isOneToOne: false
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Treatment_patientId_fkey"
            columns: ["patientId"]
            isOneToOne: false
            referencedRelation: "Patient"
            referencedColumns: ["id"]
          },
        ]
      }
      TreatmentPlanItem: {
        Row: {
          businessId: string
          createdAt: string
          deletedAt: string | null
          frequency: string | null
          id: string
          notes: string | null
          order: number
          patientId: string
          status: Database["public"]["Enums"]["PlanItemStatus"]
          title: string
          updatedAt: string
        }
        Insert: {
          businessId: string
          createdAt?: string
          deletedAt?: string | null
          frequency?: string | null
          id: string
          notes?: string | null
          order?: number
          patientId: string
          status?: Database["public"]["Enums"]["PlanItemStatus"]
          title: string
          updatedAt: string
        }
        Update: {
          businessId?: string
          createdAt?: string
          deletedAt?: string | null
          frequency?: string | null
          id?: string
          notes?: string | null
          order?: number
          patientId?: string
          status?: Database["public"]["Enums"]["PlanItemStatus"]
          title?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "TreatmentPlanItem_businessId_fkey"
            columns: ["businessId"]
            isOneToOne: false
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "TreatmentPlanItem_patientId_fkey"
            columns: ["patientId"]
            isOneToOne: false
            referencedRelation: "Patient"
            referencedColumns: ["id"]
          },
        ]
      }
      User: {
        Row: {
          avatarUrl: string | null
          createdAt: string
          email: string
          fullName: string
          id: string
          isActive: boolean
          phone: string | null
          updatedAt: string
        }
        Insert: {
          avatarUrl?: string | null
          createdAt?: string
          email: string
          fullName: string
          id: string
          isActive?: boolean
          phone?: string | null
          updatedAt: string
        }
        Update: {
          avatarUrl?: string | null
          createdAt?: string
          email?: string
          fullName?: string
          id?: string
          isActive?: boolean
          phone?: string | null
          updatedAt?: string
        }
        Relationships: []
      }
      VendorAccount: {
        Row: {
          accessEndAt: string | null
          accessStartAt: string | null
          balance: number
          businessId: string
          createdAt: string
          currency: string
          deletedAt: string | null
          id: string
          isDemo: boolean
          notes: string | null
          packageDurationDays: number | null
          plan: string
          source: Database["public"]["Enums"]["VendorAccountSource"]
          status: Database["public"]["Enums"]["VendorMembershipStatus"]
          updatedAt: string
        }
        Insert: {
          accessEndAt?: string | null
          accessStartAt?: string | null
          balance?: number
          businessId: string
          createdAt?: string
          currency?: string
          deletedAt?: string | null
          id: string
          isDemo?: boolean
          notes?: string | null
          packageDurationDays?: number | null
          plan?: string
          source?: Database["public"]["Enums"]["VendorAccountSource"]
          status?: Database["public"]["Enums"]["VendorMembershipStatus"]
          updatedAt: string
        }
        Update: {
          accessEndAt?: string | null
          accessStartAt?: string | null
          balance?: number
          businessId?: string
          createdAt?: string
          currency?: string
          deletedAt?: string | null
          id?: string
          isDemo?: boolean
          notes?: string | null
          packageDurationDays?: number | null
          plan?: string
          source?: Database["public"]["Enums"]["VendorAccountSource"]
          status?: Database["public"]["Enums"]["VendorMembershipStatus"]
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "VendorAccount_businessId_fkey"
            columns: ["businessId"]
            isOneToOne: false
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
        ]
      }
      Waitlist: {
        Row: {
          createdAt: string
          email: string
          id: string
        }
        Insert: {
          createdAt?: string
          email: string
          id: string
        }
        Update: {
          createdAt?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      book_client_appointment: {
        Args: {
          p_appointment_id: string
          p_business_id: string
          p_client_user_id: string
          p_date: string
          p_end_time: string
          p_notes: string
          p_patient_id: string
          p_price: number
          p_service_id: string
          p_staff_id: string
          p_start_time: string
          p_status: string
        }
        Returns: string
      }
      current_client_id: { Args: never; Returns: string }
    }
    Enums: {
      AppointmentSource: "DASHBOARD" | "CLIENT_APP"
      AppointmentStatus:
        | "SCHEDULED"
        | "CONFIRMED"
        | "COMPLETED"
        | "CANCELLED"
        | "NO_SHOW"
      ClientNotificationType:
        | "BOOKING_CONFIRMATION"
        | "BOOKING_PENDING"
        | "BOOKING_APPROVED"
        | "BOOKING_CANCELLED"
        | "BOOKING_RESCHEDULED"
        | "APPOINTMENT_REMINDER"
        | "REVIEW_REQUEST"
      FileCategory:
        | "TAHLIL"
        | "GORUNTU"
        | "RECETE"
        | "RAPOR"
        | "KIMLIK"
        | "DIGER"
      NotificationActionStatus: "PENDING" | "COMPLETED" | "CANCELLED"
      NotificationActionType:
        | "APPOINTMENT_APPROVE"
        | "APPOINTMENT_CANCEL"
        | "APPOINTMENT_RESCHEDULE"
        | "OPEN_LINK"
        | "OPEN_PATIENT"
        | "OPEN_APPOINTMENT"
        | "ACK"
      NotificationPriority: "LOW" | "NORMAL" | "HIGH" | "URGENT"
      NotificationType: "APPOINTMENT" | "PATIENT" | "TEAM" | "SYSTEM"
      PlanItemStatus: "AKTIF" | "PLANLANDI" | "BEKLIYOR" | "TAMAMLANDI"
      ReminderPriority: "LOW" | "NORMAL" | "HIGH"
      TeamRole:
        | "SUPER_ADMIN"
        | "ISLETME_SAHIBI"
        | "DOKTOR"
        | "SEKRETER"
        | "PERSONEL"
      TimelineEventType:
        | "PATIENT_CREATED"
        | "PATIENT_UPDATED"
        | "NOTE_ADDED"
        | "MEDICATION_ADDED"
        | "ALLERGY_ADDED"
        | "TREATMENT_ADDED"
        | "LAB_RESULT_ADDED"
        | "FILE_UPLOADED"
        | "APPOINTMENT_CREATED"
        | "APPOINTMENT_UPDATED"
        | "APPOINTMENT_COMPLETED"
        | "APPOINTMENT_CANCELLED"
      TreatmentStatus: "PLANLANDI" | "DEVAM_EDIYOR" | "TAMAMLANDI" | "IPTAL"
      VendorAccountSource: "SELF_SIGNUP" | "ADMIN_CREATED"
      VendorMembershipStatus: "TRIAL" | "ACTIVE" | "SUSPENDED" | "CANCELLED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      AppointmentSource: ["DASHBOARD", "CLIENT_APP"],
      AppointmentStatus: [
        "SCHEDULED",
        "CONFIRMED",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
      ],
      ClientNotificationType: [
        "BOOKING_CONFIRMATION",
        "BOOKING_PENDING",
        "BOOKING_APPROVED",
        "BOOKING_CANCELLED",
        "BOOKING_RESCHEDULED",
        "APPOINTMENT_REMINDER",
        "REVIEW_REQUEST",
      ],
      FileCategory: ["TAHLIL", "GORUNTU", "RECETE", "RAPOR", "KIMLIK", "DIGER"],
      NotificationActionStatus: ["PENDING", "COMPLETED", "CANCELLED"],
      NotificationActionType: [
        "APPOINTMENT_APPROVE",
        "APPOINTMENT_CANCEL",
        "APPOINTMENT_RESCHEDULE",
        "OPEN_LINK",
        "OPEN_PATIENT",
        "OPEN_APPOINTMENT",
        "ACK",
      ],
      NotificationPriority: ["LOW", "NORMAL", "HIGH", "URGENT"],
      NotificationType: ["APPOINTMENT", "PATIENT", "TEAM", "SYSTEM"],
      PlanItemStatus: ["AKTIF", "PLANLANDI", "BEKLIYOR", "TAMAMLANDI"],
      ReminderPriority: ["LOW", "NORMAL", "HIGH"],
      TeamRole: [
        "SUPER_ADMIN",
        "ISLETME_SAHIBI",
        "DOKTOR",
        "SEKRETER",
        "PERSONEL",
      ],
      TimelineEventType: [
        "PATIENT_CREATED",
        "PATIENT_UPDATED",
        "NOTE_ADDED",
        "MEDICATION_ADDED",
        "ALLERGY_ADDED",
        "TREATMENT_ADDED",
        "LAB_RESULT_ADDED",
        "FILE_UPLOADED",
        "APPOINTMENT_CREATED",
        "APPOINTMENT_UPDATED",
        "APPOINTMENT_COMPLETED",
        "APPOINTMENT_CANCELLED",
      ],
      TreatmentStatus: ["PLANLANDI", "DEVAM_EDIYOR", "TAMAMLANDI", "IPTAL"],
      VendorAccountSource: ["SELF_SIGNUP", "ADMIN_CREATED"],
      VendorMembershipStatus: ["TRIAL", "ACTIVE", "SUSPENDED", "CANCELLED"],
    },
  },
} as const
