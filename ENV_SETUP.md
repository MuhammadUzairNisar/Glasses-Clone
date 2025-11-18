# Frontend Environment Variables

## Environment Variables

The frontend uses the following environment variable:

### `REACT_APP_API_URL`

**Purpose:** Sets the base URL for the backend API

**Default:** `http://localhost:5000` (if not set)

**Example:**
```env
REACT_APP_API_URL=http://localhost:5000
```

**For Production:**
```env
REACT_APP_API_URL=https://api.yourdomain.com
```

## How to Set Up

1. Create a `.env` file in the `frontend` directory (same folder as `package.json`)

2. Add the environment variable:
```env
REACT_APP_API_URL=http://localhost:5000
```

3. Restart the development server for changes to take effect

## Important Notes

- **React requires `REACT_APP_` prefix:** All environment variables must start with `REACT_APP_` to be accessible in React code
- **Proxy setting:** The `package.json` also has a `proxy` setting that works for development, but using `REACT_APP_API_URL` gives you more control
- **Restart required:** After changing `.env` file, you must restart the React development server

## Development vs Production

- **Development:** Usually `http://localhost:5000` (when backend runs locally)
- **Production:** Your production API URL (e.g., `https://api.yourdomain.com`)

