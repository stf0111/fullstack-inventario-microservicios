CONFIGURACIÓN DEL ENTORNO

El proyecto utiliza una arquitectura de microservicios con base de datos SQL Server ejecutándose en un contenedor Docker.

BASE DE DATOS (DOCKER)

Se ha configurado un contenedor de SQL Server utilizando Docker, exponiendo el puerto 14330 para acceso local.

Para levantar el contenedor ejecutar:

docker-compose up -d

Esto creará el contenedor sqlserver_microservicios con persistencia de datos.

CREDENCIALES DE ACCESO SQL SERVER

Una vez levantado el contenedor, se puede acceder mediante SQL Server Management Studio con los siguientes datos:

Servidor: localhost,14330
Autenticación: SQL Server Authentication
Usuario: sa
Contraseña: TuPasswordSeguro123!

INICIALIZACIÓN DE LA BASE DE DATOS

Después de conectarse al motor de base de datos, se debe ejecutar el script:

BD-CATALOGO-TRANSACCION.sql

Este script realiza las siguientes acciones:

Crea las bases de datos BD_CATALOGO y BD_TRANSACCIONES
Define todas las tablas necesarias para catálogo y transacciones
Configura índices, restricciones y relaciones
Establece la estructura completa del sistema

BACKEND (.NET 8)

El sistema está compuesto por dos microservicios desarrollados en .NET 8:

Microservicio de Catálogo
Encargado de productos, categorías, marcas, imágenes y usuarios
Microservicio de Transacciones
Encargado de facturación, compras, kardex, clientes y tipos de pago

EJECUCIÓN DEL BACKEND

Cada microservicio debe ejecutarse de forma independiente:

dotnet run

También se puede ejecutar desde Visual Studio.

USUARIO AUTOMÁTICO

Al iniciar los microservicios, se crea automáticamente un usuario para pruebas:

Cédula: 1753724481
Contraseña: password

Este usuario permite ingresar al sistema sin necesidad de registro previo.

FRONTEND (ANGULAR)

El frontend está desarrollado en Angular con la siguiente configuración:

Angular CLI: 21.0.0
Node.js: 24.11.1
npm: 11.6.2

EJECUCIÓN DEL FRONTEND

Instalar dependencias:

npm install

Levantar el proyecto:

ng serve

El sistema estará disponible en:

http://localhost:4200