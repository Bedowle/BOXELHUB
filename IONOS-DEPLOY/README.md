# VoxelHub - Despliegue en Ionos

## Estructura de archivos

```
IONOS-DEPLOY/
├── public/                    # Frontend estático
│   ├── index.html            # Página principal
│   └── assets/               # CSS y JavaScript compilado
│       ├── index-*.css       # Estilos
│       └── index-*.js        # Código JavaScript
├── index.js                  # Backend Node.js
└── README.md                 # Este archivo
```

## Requisitos

- **Node.js 18+** instalado en el servidor
- **Acceso a base de datos PostgreSQL** (Neon u otro proveedor)
- **Variables de entorno** configuradas

## Instalación en Ionos

### Opción 1: Solo Frontend (sin backend en Ionos)

1. **Sube la carpeta `public/` a tu servidor web**
   - En Ionos, sube todo a la carpeta `public_html/` o `www/`
   - Estructura final debe ser:
     ```
     /public_html/
     ├── index.html
     ├── assets/
     │   ├── index-*.css
     │   └── index-*.js
     ```

2. **Configura el servidor para SPA**
   - En `.htaccess` (si usas Apache):
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

3. **Asegúrate de tener acceso al backend**
   - El frontend conectará al backend que ejecutes por separado
   - Configura las URLs de API en las variables de entorno

### Opción 2: Frontend + Backend en Ionos (con Node.js)

1. **SSH al servidor Ionos**
   ```bash
   ssh usuario@tu-dominio.com
   ```

2. **Sube los archivos**
   ```bash
   # Copia index.js al servidor
   scp index.js usuario@tu-dominio.com:/home/usuario/voxelhub/
   # Copia la carpeta public al servidor
   scp -r public usuario@tu-dominio.com:/home/usuario/voxelhub/
   ```

3. **Instala dependencias del backend**
   ```bash
   cd /home/usuario/voxelhub
   npm install
   ```

4. **Configura variables de entorno**
   ```bash
   # Crea archivo .env
   echo "DATABASE_URL=postgresql://usuario:password@host:5432/bd_voxelhub" > .env
   echo "SESSION_SECRET=tu_secret_aqui" >> .env
   echo "NODE_ENV=production" >> .env
   ```

5. **Ejecuta el backend**
   ```bash
   node index.js
   ```

## Variables de Entorno Necesarias

```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SESSION_SECRET=una_clave_secreta_segura
NODE_ENV=production
ISSUER_URL=https://tu-issuer.url (si usas autenticación)
```

## Notas Importantes

- El frontend está optimizado y minificado
- Los archivos CSS y JS están versionados (nombres con hash)
- Todas las peticiones a API van a `/api/*`
- Las conexiones WebSocket usan `/ws`

## Soporte

Para problemas, revisa los logs del servidor:
- Frontend: Abre la consola del navegador (F12)
- Backend: `tail -f application.log`

---

**Última actualización:** Noviembre 2025
