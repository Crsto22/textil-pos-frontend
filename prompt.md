Las APIs que frontend debe considerar como modificadas son estas dos:

- `GET /api/venta/{id}/sunat/cdr`
- `GET /api/nota-credito/{id}/sunat/cdr`

Ahora ambas aceptan un query param opcional:

- `?formato=xml`
- `?formato=zip`

Comportamiento:
- Si no mandas `formato`, el backend usa `xml` por defecto.
- `formato=xml` devuelve el XML del CDR.
- `formato=zip` devuelve el ZIP original del CDR.
- El `Content-Type` ahora puede ser `application/xml` o `application/zip`.
- El nombre real del archivo viene en `Content-Disposition`.



Las APIs que no cambiaron de ruta ni de uso son:

- `GET /api/venta/{id}/sunat/xml`
- `GET /api/nota-credito/{id}/sunat/xml`
- `GET /api/venta/{id}/comprobante/pdf`
- `GET /api/nota-credito/{id}/comprobante/pdf`


Para JSON, no te cambié rutas nuevas de detalle/listado, pero sí hay una consideración importante:
- En `VentaResponse` sigue existiendo `sunatZipNombre`, pero ahora es solo informativo.
- El campo útil para CDR sigue siendo `sunatCdrNombre`, y para documentos nuevos normalmente vendrá como nombre `.zip`.

Referencia:

En frontend te recomiendo este ajuste práctico:
- Botón `Ver CDR`: llamar `GET /sunat/cdr?formato=xml`
- Botón `Descargar CDR`: llamar `GET /sunat/cdr?formato=zip`
- Mantener `GET /sunat/xml` como descarga/visualización del XML firmado

tenemos estas modifiaciones de los apis correspondientes por ello has las modifiaciones de esta api por favor correctamente