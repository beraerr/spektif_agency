# Spektif Agency - API Reference

## Base URL
```
https://europe-west4-spektif-agency-final-prod.cloudfunctions.net
```

## Authentication
All endpoints require proper CORS headers and are publicly accessible.

## Endpoints

### Authentication

#### POST /login
Authenticate user and get backend token.

**Request:**
```json
{
  "email": "admin@spektif.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "backend_token_here",
  "user": {
    "id": "admin",
    "email": "admin@spektif.com",
    "name": "Admin User",
    "role": "ADMIN"
  }
}
```

### Organizations

#### GET /getOrganizations
Get all organizations.

**Response:**
```json
[
  {
    "id": "spektif",
    "name": "Spektif Agency",
    "members": ["admin"],
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
]
```

### Users/Employees

#### GET /getEmployees
Get employees for an organization.

**Query Parameters:**
- `organizationId` (string, required): Organization ID

**Response:**
```json
[
  {
    "id": "emp-1",
    "email": "john.doe@spektif.com",
    "name": "John",
    "surname": "Doe",
    "position": "Frontend Developer",
    "phone": "+90 555 123 4567",
    "role": "employee",
    "organizationId": "spektif",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
]
```

#### POST /createEmployee
Create a new employee.

**Request:**
```json
{
  "email": "new@spektif.com",
  "name": "New",
  "surname": "Employee",
  "position": "Developer",
  "phone": "+90 555 000 0000",
  "role": "employee",
  "organizationId": "spektif"
}
```

### Clients

#### GET /getClients
Get clients for an organization.

**Query Parameters:**
- `organizationId` (string, required): Organization ID

**Response:**
```json
[
  {
    "id": "client-1",
    "name": "Acme Corporation",
    "email": "contact@acme.com",
    "phone": "+90 555 111 2233",
    "company": "Acme Corporation",
    "address": "İstanbul, Türkiye",
    "notes": "Ana müşteri - web tasarım projeleri",
    "status": "active",
    "organizationId": "spektif",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
]
```

#### POST /createClient
Create a new client.

**Request:**
```json
{
  "name": "New Client",
  "email": "client@example.com",
  "phone": "+90 555 000 0000",
  "company": "Client Company",
  "address": "Address",
  "notes": "Notes",
  "status": "active",
  "organizationId": "spektif"
}
```

### Boards

#### GET /getBoards
Get boards for a user.

**Query Parameters:**
- `userId` (string, required): User ID

**Response:**
```json
[
  {
    "id": "board-1",
    "title": "Project Board",
    "description": "Board description",
    "organizationId": "spektif",
    "color": "#3B82F6",
    "backgroundUrl": "https://example.com/bg.jpg",
    "members": ["admin"],
    "lists": [
      {
        "id": "list-1",
        "title": "To Do",
        "position": 0,
        "cards": [
          {
            "id": "card-1",
            "title": "Task 1",
            "description": "Task description",
            "dueDate": "2025-01-15T00:00:00.000Z",
            "position": 0,
            "members": ["admin"]
          }
        ]
      }
    ],
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
]
```

#### GET /getBoard
Get a single board with all lists and cards.

**Query Parameters:**
- `boardId` (string, required): Board ID

**Response:**
```json
{
  "id": "board-1",
  "title": "Project Board",
  "description": "Board description",
  "organizationId": "spektif",
  "color": "#3B82F6",
  "backgroundUrl": "https://example.com/bg.jpg",
  "members": ["admin"],
  "lists": [
    {
      "id": "list-1",
      "title": "To Do",
      "position": 0,
      "cards": [
        {
          "id": "card-1",
          "title": "Task 1",
          "description": "Task description",
          "dueDate": "2025-01-15T00:00:00.000Z",
          "position": 0,
          "members": ["admin"],
          "createdAt": "timestamp",
          "updatedAt": "timestamp"
        }
      ]
    }
  ],
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### POST /createBoard
Create a new board.

**Request:**
```json
{
  "title": "New Board",
  "description": "Board description",
  "organizationId": "spektif",
  "userId": "admin",
  "color": "#3B82F6"
}
```

**Response:**
```json
{
  "id": "new-board-id",
  "title": "New Board",
  "description": "Board description",
  "organizationId": "spektif",
  "color": "#3B82F6",
  "members": ["admin"],
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### POST /updateBoardBackground
Update board background image.

**Request:**
```json
{
  "boardId": "board-id",
  "backgroundUrl": "https://example.com/new-bg.jpg"
}
```

**Response:**
```json
{
  "success": true
}
```

### Lists

#### POST /createList
Create a new list in a board.

**Request:**
```json
{
  "boardId": "board-id",
  "title": "New List",
  "position": 0
}
```

**Response:**
```json
{
  "id": "new-list-id",
  "title": "New List",
  "position": 0,
  "boardId": "board-id",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### POST /updateList
Update a list.

**Request:**
```json
{
  "id": "list-id",
  "title": "Updated List Title"
}
```

**Response:**
```json
{
  "id": "list-id",
  "title": "Updated List Title",
  "position": 0,
  "boardId": "board-id",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### POST /deleteList
Delete a list.

**Request:**
```json
{
  "id": "list-id"
}
```

**Response:**
```json
{
  "success": true
}
```

#### POST /reorderLists
Reorder lists in a board.

**Request:**
```json
{
  "boardId": "board-id",
  "listOrders": [
    { "id": "list-1", "position": 0 },
    { "id": "list-2", "position": 1 }
  ]
}
```

**Response:**
```json
{
  "success": true
}
```

### Cards

#### POST /createCard
Create a new card in a list.

**Request:**
```json
{
  "boardId": "board-id",
  "listId": "list-id",
  "title": "New Card",
  "description": "Card description",
  "dueDate": "2025-01-15T00:00:00.000Z"
}
```

**Response:**
```json
{
  "id": "new-card-id",
  "title": "New Card",
  "description": "Card description",
  "dueDate": "2025-01-15T00:00:00.000Z",
  "listId": "list-id",
  "position": 0,
  "members": [],
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### POST /updateCard
Update a card.

**Request:**
```json
{
  "id": "card-id",
  "title": "Updated Card Title",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "id": "card-id",
  "title": "Updated Card Title",
  "description": "Updated description",
  "dueDate": "2025-01-15T00:00:00.000Z",
  "listId": "list-id",
  "position": 0,
  "members": [],
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### POST /deleteCard
Delete a card.

**Request:**
```json
{
  "id": "card-id"
}
```

**Response:**
```json
{
  "success": true
}
```

#### POST /moveCard
Move a card between lists.

**Request:**
```json
{
  "id": "card-id",
  "listId": "new-list-id",
  "position": 1,
  "boardId": "board-id"
}
```

**Response:**
```json
{
  "success": true
}
```

#### GET /getCards
Get cards for a board or list.

**Query Parameters:**
- `boardId` (string, optional): Board ID
- `listId` (string, optional): List ID

**Response:**
```json
[
  {
    "id": "card-1",
    "title": "Card Title",
    "description": "Card description",
    "dueDate": "2025-01-15T00:00:00.000Z",
    "listId": "list-id",
    "position": 0,
    "members": ["admin"],
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
]
```

### Calendar

#### GET /getCalendarEvents
Get calendar events (cards with due dates) for a board.

**Query Parameters:**
- `boardId` (string, required): Board ID
- `startDate` (string, optional): Start date filter
- `endDate` (string, optional): End date filter

**Response:**
```json
[
  {
    "id": "card-1",
    "title": "Card Title",
    "description": "Card description",
    "dueDate": "2025-01-15T00:00:00.000Z",
    "listId": "list-id",
    "boardId": "board-id",
    "members": ["admin"],
    "priority": "medium"
  }
]
```

### Files

#### POST /uploadFile
Upload a file.

**Request:**
```
Content-Type: multipart/form-data
file: [file data]
```

**Response:**
```json
{
  "success": true,
  "url": "https://storage.googleapis.com/bucket/file.jpg"
}
```

### System

#### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T00:00:00.000Z",
  "database": "connected"
}
```

#### GET /testFirestore
Test Firestore connection.

**Response:**
```json
{
  "success": true,
  "databaseId": "spektif",
  "region": "europe-west4"
}
```

#### POST /seedDatabase
Seed database with sample data.

**Response:**
```json
{
  "success": true,
  "message": "Database seeded successfully!",
  "data": {
    "users": 3,
    "organizations": 1,
    "boards": 1,
    "lists": 3,
    "cards": 3,
    "clients": 3
  }
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message",
  "success": false
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (missing parameters)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limits

Currently no rate limits are implemented. All endpoints are publicly accessible.

## CORS

All endpoints support CORS and can be called from any origin.

## Authentication

Currently using a simple token-based system. The `login` endpoint returns a token that should be included in subsequent requests (though this is not fully implemented in all endpoints).

---

*Last Updated: January 2025*
