# 📊 Glow Book - UML Class Diagram

## Class Diagram

![Glow Book Class Diagram](./class-diagram.png)

## 📋 Legend

| Symbol | Meaning |
|--------|---------|
| `<<Entity>>` | Core entity class |
| `<<enum>>` | Enumeration type |
| `<<interface>>` | Interface |
| `-` | Private member |
| `+` | Public member |
| `1` | One |
| `0..*` | Zero or many |
| `0..1` | Zero or one |

## 🏗️ Core Entities

| Entity | Attributes | Methods |
|--------|------------|---------|
| **User** | Id, Name, Email, PasswordHash, Role | VerifyPassword(), UpdateProfile() |
| **Service** | Id, Name, Price, DurationMinutes | CalculatePriceWithDiscount() |
| **Appointment** | Id, UserId, ServiceId, Date, Status | Cancel(), Confirm(), Complete() |
| **Payment** | Id, AppointmentId, Amount, Status | ProcessPayment(), Refund() |
| **Review** | Id, UserId, AppointmentId, Rating, Comment | IsValidRating() |

## 💅 Nail Salon Entities

| Entity | Description |
|--------|-------------|
| **NailTechnician** | Manicurist staff with specialization and commission |
| **NailService** | Detailed nail services with categories |
| **AppointmentDetails** | Nail-specific info (shape, length, colors) |
| **NailProduct** | Inventory management for polishes and supplies |
| **NailColorChart** | Color catalog with hex codes |
| **AftercareInstruction** | Post-service care instructions |
| **LoyaltyReward** | Points and rewards for loyal customers |
| **AuditLog** | System audit trail for all actions |

## 🔧 Repository Pattern

| Class | Type | Description |
|-------|------|-------------|
| `IRepository<T>` | Interface | Generic CRUD operations |
| `FileRepository<T>` | Implementation | CSV file storage |

## 🔗 Key Relationships
