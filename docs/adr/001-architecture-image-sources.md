# ADR 001: Gestión de Fuentes de Imagen en Assets (Carga local vs Enlace externo)

## Estado
Aceptado e Implementado (Agosto 2026)

## Contexto
En TRACE MVP v0, los assets necesitan vincularse a imágenes que pueden provenir de dos fuentes diferentes:
1. **Archivos Locales:** Subidos directamente por el usuario desde su dispositivo hacia el almacenamiento privado de Supabase Storage (`asset-images`).
2. **Enlaces Externos (URLs Originales):** Copiados directamente desde internet (ej. repositorios de imágenes, bibliotecas de assets externos).

### Desafío Técnico
* El sandbox del navegador impide conocer la URL original de descarga de un archivo local al subirlo.
* Almacenar enlaces temporales (`signed URLs`) de Supabase en la base de datos es una mala práctica ya que vencen (en 1 hora).
* Queremos optimizar/comprimir las imágenes externas para evitar enlaces rotos si el sitio original los borra, pero conservando la URL original a modo de referencia/crédito.

## Decisión Propuesta (Próxima Fase)
Para las siguientes iteraciones del MVP, implementaremos la siguiente arquitectura de dos campos:

1. **Esquema de Base de Datos (Prisma):**
   * Conservar `imageUrl` (string, almacena el path relativo de Supabase Storage o la URL externa si no se ha descargado).
   * Agregar un nuevo campo opcional `originalImageUrl` (string) al modelo `Asset` para persistir la URL externa de origen, incluso si la imagen se almacena físicamente en Supabase.

2. **Flujo de Procesamiento en Segundo Plano (Worker):**
   * Cuando el usuario ingresa una URL externa en el formulario:
     1. La aplicación guarda esa URL directamente en `originalImageUrl`.
     2. Se dispara un proceso en segundo plano (Server Action / Background Job) que realiza un fetch de la imagen original.
     3. El servidor comprime y procesa la imagen para transformarla a un formato optimizado (ej. `.webp`).
     4. Sube el archivo procesado a la carpeta del proyecto en Supabase Storage.
     5. Actualiza `imageUrl` con el path relativo del Storage (`{userId}/{projectId}/{assetId}/cached-image.webp`).
   * Si el usuario sube un archivo local directamente:
     * Se sube al Storage, `imageUrl` guarda el path del Storage y `originalImageUrl` permanece nulo.

3. **Beneficios:**
   * **Resiliencia:** Si la URL externa original se cae, la aplicación sigue mostrando la imagen desde la caché de Supabase Storage.
   * **Optimización:** Todas las imágenes que se renderizan pasan por el mismo pipeline de compresión y preview seguro (Signed URLs).
   * **Auditoría y Créditos:** El usuario siempre puede ver de dónde provino originalmente la imagen consultando el campo "Origen de Imagen".

## Detalles Adicionales de Implementación
* **Extracción de Metadatos con IA (Gemini):** Al agregar/editar un asset con una URL externa (ej. Unsplash) o imagen local, se analiza su contenido y/o se raspa la página web para autocompletar e insertar de forma directa los registros de `RightsRecord` (Titular, Licencia, enlace, EXIF de la cámara, fecha y ubicación en las notas) y `SustainabilityRecord` (Material y Peso).
* **Eliminación en Cascada:** Se implementó la eliminación de Proyectos y Assets desde la interfaz. La eliminación de un proyecto remueve en cascada todos sus assets, eventos y registros asociados gracias a la integridad referencial en Postgres.
