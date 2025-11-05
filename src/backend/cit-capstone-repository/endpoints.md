# Capstone Repo Endpoints

## Authentication

### Login

POST `/api/login` - Login a user

Request

```json
{
  "email": "test@maili.com",
  "password": "password"
}
```

Response

- `200` - Login successful

```json
{
  "accessToken": "<access token>"
}
```

- `400` - Invalid Credentials

```json
{
  "status": "error",
  "code": "invalid_credentials",
  "message": "Invalid Credentials"
}
```

## Capstone

### List all capstone projects

GET `/api/capstones[?search=:search&page=:page&limit=:limit&sort=-title,date]` - Get all capstone projects

Returns a paginated response of all the capstone projects.

Request

- `search` - (optional) keyword matching any capstone projects (search in title, description, etc)
- `page` - (optional, default: 1) The page number
- `limit` - (optional, default: 10) The number of capstone projects to return per page
- `sort` - (optional) Sort order. To sort in descending order, add a `-` prefix in the column name.

Response

```json
{
  "data": [
    {
      "id": 1,
      "title": "<Capstone Title>",
      "description": "Description",
      "coverImage": "http://url/phot.jpg",
      "authors": ["John Doe", "Juan Dela Cruz"],
      "summary": "Summary",
      "keywords": ["iot", "agriculture"]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 500,
    "totalPages": 50,
    "nextPage": 2,
    "previousPage": null,
    "search": ""
  }
}
```
