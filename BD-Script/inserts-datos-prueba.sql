USE [BD_CATALOGO];
GO

/* =========================================
   USUARIO - 3 registros
   Nota: USU_PASSWORD queda en texto plano solo como dato semilla.
   Si el backend usa hash, este valor debe reemplazarse luego.
   ========================================= */
INSERT INTO [dbo].[USUARIO]
(
    [USU_CEDULA],
    [USU_NOMBRE],
    [USU_APELLIDO],
    [USU_ROL],
    [USU_ESTADO],
    [USU_PASSWORD],
    [CREATED_BY],
    [UPDATED_BY],
    [DELETED_BY]
)
VALUES
('1723456789', 'Carlos', 'Mendoza', 'OPERADOR', 1, NULL , NULL, NULL, NULL),
('1712345678', 'Andrea', 'Lopez', 'VENDEDOR', 1, NULL , NULL, NULL, NULL);
GO

/* =========================================
   CONFIGURACION - 1 registro
   ========================================= */
INSERT INTO [dbo].[CONFIGURACION]
(
    [IVA_PORCENTAJE],
    [ESTABLECIMIENTO],
    [PUNTO_EMISION],
    [ULTIMO_SECUENCIAL],
    [CREATED_BY],
    [UPDATED_BY],
    [DELETED_BY]
)
VALUES
(15.00, '001', '001', 0, NULL, NULL, NULL);
GO

/* =========================================
   MARCA - 3 registros
   ========================================= */
INSERT INTO [dbo].[MARCA]
(
    [MARCA_NOMBRE],
    [CREATED_BY],
    [UPDATED_BY],
    [DELETED_BY]
)
VALUES
('Optimum Nutrition', NULL, NULL, NULL),
('Dymatize', NULL, NULL, NULL),
('Dragon Pharma', NULL, NULL, NULL);
GO

/* =========================================
   CATEGORIA - 3 registros
   ========================================= */
INSERT INTO [dbo].[CATEGORIA]
(
    [CAT_NOMBRE],
    [CREATED_BY],
    [UPDATED_BY],
    [DELETED_BY]
)
VALUES
('Proteina', NULL, NULL, NULL),
('Creatina', NULL, NULL, NULL),
('Pre Entreno', NULL, NULL, NULL);
GO

/* =========================================
   PRODUCTO - 3 registros
   Se asume que MARCA_ID y CAT_ID generados serán 1, 2 y 3
   porque la base está recién creada y sin datos previos.
   ========================================= */
INSERT INTO [dbo].[PRODUCTO]
(
    [PROD_NOMBRE],
    [PROD_DESCRIPCION],
    [CAT_ID],
    [MARCA_ID],
    [PROD_PRECIOVEN],
    [PROD_PRECIOCOM],
    [PROD_CANTIDAD],
    [PROD_ESTADO],
    [CREATED_BY],
    [UPDATED_BY],
    [DELETED_BY]
)
VALUES
('Gold Standard Whey 5 lb', 'Proteina en polvo para apoyo al desarrollo muscular y recuperacion', 1, 1, 89.99, 70.00, 25, 1, NULL, NULL, NULL),
('Creatina Monohidratada 300 g', 'Creatina para mejorar fuerza y potencia muscular', 2, 2, 34.50, 24.00, 40, 1, NULL, NULL, NULL),
('Pre Workout 300 g', 'Pre entreno para energia, enfoque e intensidad', 3, 3, 39.99, 28.00, 18, 1, NULL, NULL, NULL);
GO

/* =========================================
   IMAGEN - 3 registros
   Se asume que PROD_ID generados serán 1, 2 y 3
   porque la base está recién creada y sin datos previos.
   ========================================= */
INSERT INTO [dbo].[IMAGEN]
(
    [PROD_ID],
    [IMG_NOMBRE],
    [IMG_URL],
    [IMG_DESCRIPCION],
    [ES_PRINCIPAL],
    [ORDEN],
    [IMG_ESTADO],
    [CREATED_BY],
    [UPDATED_BY],
    [DELETED_BY]
)
VALUES
(1, 'Gold Standard Whey', 'https://ejemplo.com/imagenes/whey.jpg', 'Imagen principal de Gold Standard Whey', 1, 1, 1, NULL, NULL, NULL),
(2, 'Creatina Monohidratada', 'https://ejemplo.com/imagenes/creatina.jpg', 'Imagen principal de Creatina Monohidratada', 1, 1, 1, NULL, NULL, NULL),
(3, 'Pre Workout', 'https://ejemplo.com/imagenes/preworkout.jpg', 'Imagen principal de Pre Workout', 1, 1, 1, NULL, NULL, NULL);
GO

USE [BD_TRANSACCIONES];
GO

/* =========================================
   CLIENTE - 3 registros
   ========================================= */
INSERT INTO [dbo].[CLIENTE]
(
    [CLI_CEDULA],
    [CLI_NOMBRE],
    [CLI_APELLIDO],
    [CLI_DIRECCION],
    [CLI_CORREO],
    [CLI_TELEFONO],
    [CREATED_BY],
    [UPDATED_BY],
    [DELETED_BY]
)
VALUES
('0102030405', 'Luis', 'Perez', 'Quito Norte', 'luis.perez@example.com', '0991111111', NULL, NULL, NULL),
('1102030405', 'Maria', 'Gomez', 'Quito Centro', 'maria.gomez@example.com', '0992222222', NULL, NULL, NULL),
('2203040506', 'Jose', 'Ramirez', 'Quito Sur', 'jose.ramirez@example.com', '0993333333', NULL, NULL, NULL);
GO

/* =========================================
   PROVEEDOR - 3 registros
   ========================================= */
INSERT INTO [dbo].[PROVEEDOR]
(
    [PROV_NOMBRE],
    [PROV_RUC],
    [PROV_TELEFONO],
    [PROV_DIRECCION],
    [PROV_CORREO],
    [CREATED_BY],
    [UPDATED_BY],
    [DELETED_BY]
)
VALUES
('Suplementos Globales', '1790011111001', '022345678', 'Quito, Ecuador', 'ventas@suplementosglobales.com', NULL, NULL, NULL),
('Importadora Fitness Pro', '1790022222001', '022456789', 'Guayaquil, Ecuador', 'contacto@fitnesspro.com', NULL, NULL, NULL),
('Nutrition Wholesale EC', '1790033333001', '022567890', 'Cuenca, Ecuador', 'info@nutritionwholesale.com', NULL, NULL, NULL);
GO

/* =========================================
   TIPO_PAGO - 3 registros
   ========================================= */
INSERT INTO [dbo].[TIPO_PAGO]
(
    [TPA_NOMBRE],
    [CREATED_BY],
    [UPDATED_BY],
    [DELETED_BY]
)
VALUES
('Efectivo', NULL, NULL, NULL),
('Transferencia', NULL, NULL, NULL),
('Tarjeta', NULL, NULL, NULL);
GO

/* =========================================
   KARDEX - 3 registros
   Se asume que PROD_ID generados en BD_CATALOGO serán 1, 2 y 3
   y que el usuario lógico principal será USU_ID = 1.
   ========================================= */
INSERT INTO [dbo].[KARDEX]
(
    [PROD_ID],
    [USU_ID],
    [KDX_FECHA],
    [KDX_TIPO],
    [KDX_MOTIVO],
    [KDX_DOC_REFER],
    [KDX_CANTIDAD],
    [KDX_SALDO_ANT],
    [KDX_SALDO_FINAL],
    [KDX_COSTO_UNIT],
    [KDX_PRECIO_UNIT]
)
VALUES
(1, 1, SYSDATETIME(), 'Entrada', 'Carga Inicial', 'INI-001', 25, 0, 25, 70.00, 89.99),
(2, 1, SYSDATETIME(), 'Entrada', 'Carga Inicial', 'INI-002', 40, 0, 40, 24.00, 34.50),
(3, 1, SYSDATETIME(), 'Entrada', 'Carga Inicial', 'INI-003', 18, 0, 18, 28.00, 39.99);
GO