import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#10b981',
    paddingBottom: 15,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
  badge: {
    backgroundColor: '#f1f5f9',
    color: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 'bold',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 25,
  },
  summaryCard: {
    flex: 1,
    padding: 12,
    backgroundColor: '#ecfdf5',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 9,
    color: '#065f46',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#047857',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 15,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 4,
  },
  assetItem: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 6,
  },
  assetTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  assetStage: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#2563eb',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  assetBody: {
    flexDirection: 'row',
    gap: 15,
  },
  assetImage: {
    width: 120,
    height: 90,
    borderRadius: 4,
    objectFit: 'cover',
  },
  assetInfo: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  label: {
    width: 120,
    fontWeight: 'bold',
    color: '#475569',
    fontSize: 9,
  },
  value: {
    flex: 1,
    color: '#0f172a',
    fontSize: 9,
  },
  subSubTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 10,
    marginBottom: 4,
  },
  timeline: {
    borderLeftWidth: 1,
    borderLeftColor: '#cbd5e1',
    marginLeft: 5,
    paddingLeft: 10,
    marginVertical: 5,
  },
  timelineItem: {
    marginBottom: 4,
  },
  timelineText: {
    fontSize: 8,
    color: '#64748b',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
});

const STAGE_LABELS: Record<string, string> = {
  DESIGN: 'Diseño',
  PRODUCTION: 'Producción',
  SHOOTING: 'Rodaje',
  FINAL_DESTINATION: 'Destino Final',
};

const LICENSE_LABELS: Record<string, string> = {
  ORIGINAL: 'Original (Derechos propios / Obra original)',
  STOCK_LICENSED: 'Stock / Licenciado (Adquirido bajo licencia)',
  AI_GENERATED: 'Generado por IA (Sujeto a términos de herramienta)',
  PUBLIC_DOMAIN: 'Dominio Público / Creative Commons',
  UNKNOWN: 'Desconocido / Pendiente de verificación',
};

const STATUS_LABELS: Record<string, string> = {
  APPROVED: 'Aprobado',
  PENDING: 'Pendiente',
  REJECTED: 'Rechazado',
};

const CIRCULARITY_LABELS: Record<string, string> = {
  PENDING: 'Pendiente (En uso o sin destino final definido)',
  REUSED: 'Reutilizado (Trasladado a otra producción / almacén)',
  DONATED: 'Donado (Entregado a ONG, escuela u otra entidad)',
  RECYCLED: 'Reciclado (Desarmado para recuperación de materiales)',
  DISCARDED: 'Desechado / Residuo (Sin recuperación circular)',
};

interface ProjectPdfDocumentProps {
  project: {
    id: string;
    name: string;
    description?: string | null;
    createdAt: Date;
    assets: any[];
  };
}

export function ProjectPdfDocument({ project }: ProjectPdfDocumentProps) {
  const totalAssets = project.assets.length;
  
  // Calculate CO2 Total
  const totalCo2 = project.assets.reduce((sum, asset) => {
    return sum + (asset.sustainabilityRecord?.estimatedCo2eqKg || 0);
  }, 0);

  // Calculate Rights Documented %
  const assetsWithRights = project.assets.filter((a) => a.rightsRecord).length;
  const rightsPercentage = totalAssets > 0 ? Math.round((assetsWithRights / totalAssets) * 100) : 0;

  const todayFormatted = new Date().toLocaleDateString('es-ES', {
    timeZone: 'Europe/Madrid',
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>TRACE — Reporte de Proyecto</Text>
            <Text style={styles.subtitle}>{project.name}</Text>
            {project.description && (
              <Text style={{ fontSize: 9, color: '#475569', marginTop: 4 }}>
                {project.description}
              </Text>
            )}
          </View>
          <Text style={styles.badge}>Generado: {todayFormatted}</Text>
        </View>

        {/* Summary Grid */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Assets</Text>
            <Text style={styles.summaryValue}>{totalAssets}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
            <Text style={[styles.summaryLabel, { color: '#1e40af' }]}>CO₂eq Total</Text>
            <Text style={[styles.summaryValue, { color: '#1d4ed8' }]}>
              {totalCo2.toFixed(1)} kg
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#faf5ff', borderColor: '#e9d5ff' }]}>
            <Text style={[styles.summaryLabel, { color: '#6b21a8' }]}>Derechos OK</Text>
            <Text style={[styles.summaryValue, { color: '#7e22ce' }]}>{rightsPercentage}%</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Assets en el Proyecto</Text>

        {project.assets.length === 0 ? (
          <Text style={{ fontStyle: 'italic', color: '#94a3b8', padding: 10 }}>
            Este proyecto no contiene assets registrados todavía.
          </Text>
        ) : (
          project.assets.map((asset) => {
            const stageTranslated = STAGE_LABELS[asset.currentStage] || asset.currentStage;
            return (
              <View key={asset.id} style={styles.assetItem} wrap={false}>
                <View style={styles.assetHeader}>
                  <Text style={styles.assetTitle}>{asset.title}</Text>
                  <Text style={styles.assetStage}>{stageTranslated}</Text>
                </View>

                <View style={styles.assetBody}>
                  {asset.imageUrl && <Image src={asset.imageUrl} style={styles.assetImage} />}
                  
                  <View style={styles.assetInfo}>
                    <View style={styles.row}>
                      <Text style={styles.label}>Descripción:</Text>
                      <Text style={styles.value}>{asset.description || 'Sin descripción'}</Text>
                    </View>
                    {asset.set && (
                      <View style={styles.row}>
                        <Text style={styles.label}>Decorado / Set:</Text>
                        <Text style={styles.value}>
                          {asset.set.name} {asset.set.location ? `(${asset.set.location})` : ''}
                        </Text>
                      </View>
                    )}

                    {/* Rights Summary */}
                    {asset.rightsRecord ? (
                      <View style={{ marginTop: 6 }}>
                        <Text style={styles.subSubTitle}>Derechos & Licencia</Text>
                        <View style={styles.row}>
                          <Text style={styles.label}>Tipo de Licencia:</Text>
                          <Text style={styles.value}>
                            {LICENSE_LABELS[asset.rightsRecord.licenseType] || asset.rightsRecord.licenseType}
                          </Text>
                        </View>
                        {asset.rightsRecord.sourceName && (
                          <View style={styles.row}>
                            <Text style={styles.label}>Origen:</Text>
                            <Text style={styles.value}>{asset.rightsRecord.sourceName}</Text>
                          </View>
                        )}
                        <View style={styles.row}>
                          <Text style={styles.label}>Estado Legal:</Text>
                          <Text style={styles.value}>
                            {STATUS_LABELS[asset.rightsRecord.legalStatus] || asset.rightsRecord.legalStatus}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: 8, marginTop: 4 }}>
                        Sin registro de derechos.
                      </Text>
                    )}

                    {/* Sustainability Summary */}
                    {asset.sustainabilityRecord ? (
                      <View style={{ marginTop: 6 }}>
                        <Text style={styles.subSubTitle}>Sustentabilidad</Text>
                        {asset.sustainabilityRecord.material && (
                          <View style={styles.row}>
                            <Text style={styles.label}>Material:</Text>
                            <Text style={styles.value}>{asset.sustainabilityRecord.material}</Text>
                          </View>
                        )}
                        <View style={styles.row}>
                          <Text style={styles.label}>CO₂ Estimado:</Text>
                          <Text style={styles.value}>
                            {asset.sustainabilityRecord.estimatedCo2eqKg || 0} kg CO₂eq
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: 8, marginTop: 4 }}>
                        Sin registro de sustentabilidad.
                      </Text>
                    )}

                    {/* Lifecycle History */}
                    {asset.events && asset.events.length > 0 && (
                      <View style={{ marginTop: 6 }}>
                        <Text style={styles.subSubTitle}>Historial del Ciclo de Vida</Text>
                        <View style={styles.timeline}>
                          {asset.events.map((event: any) => {
                            const date = new Date(event.timestamp).toLocaleDateString('es-ES', {
                              timeZone: 'Europe/Madrid',
                            });
                            return (
                              <View key={event.id} style={styles.timelineItem}>
                                <Text style={styles.timelineText}>
                                  • {date} - {STAGE_LABELS[event.newStage] || event.newStage}
                                  {event.notes ? ` (${event.notes})` : ''}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Documento generado automáticamente por TRACE Asset Lifecycle System — {todayFormatted}
        </Text>
      </Page>
    </Document>
  );
}
