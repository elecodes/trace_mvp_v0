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
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 15,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 3,
  },
  badge: {
    backgroundColor: '#ecfdf5',
    color: '#047857',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 140,
    fontWeight: 'bold',
    color: '#475569',
  },
  value: {
    flex: 1,
    color: '#0f172a',
  },
  image: {
    width: 160,
    height: 120,
    borderRadius: 6,
    objectFit: 'cover',
    marginBottom: 10,
  },
  flexRow: {
    flexDirection: 'row',
    gap: 15,
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

interface AssetPdfProps {
  asset: {
    id: string;
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    currentStage: string;
    createdAt: Date;
    project: { name: string };
    rightsRecord?: {
      licenseType: string;
      sourceName?: string | null;
      licenseDocUrl?: string | null;
      isAiGenerated: boolean;
      aiToolName?: string | null;
      legalStatus: string;
      notes?: string | null;
    } | null;
    sustainabilityRecord?: {
      material?: string | null;
      weightKg?: number | null;
      emissionFactor?: number | null;
      estimatedCo2eqKg?: number | null;
      circularityOutcome: string;
      notes?: string | null;
    } | null;
  };
}

export function AssetPdfDocument({ asset }: AssetPdfProps) {
  const stageTranslated = STAGE_LABELS[asset.currentStage] || asset.currentStage;
  const formattedDate = new Date(asset.createdAt).toLocaleDateString('es-ES', {
    timeZone: 'Europe/Madrid',
  });
  const todayFormatted = new Date().toLocaleDateString('es-ES', {
    timeZone: 'Europe/Madrid',
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>TRACE — Reporte de Asset</Text>
            <Text style={styles.subtitle}>
              Identificador Único: {asset.id} | Proyecto: {asset.project.name}
            </Text>
          </View>
          <Text style={styles.badge}>Etapa: {stageTranslated}</Text>
        </View>

        {/* Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Información del Asset</Text>
          <View style={styles.flexRow}>
            {asset.imageUrl && <Image src={asset.imageUrl} style={styles.image} />}
            <View style={{ flex: 1 }}>
              <View style={styles.row}>
                <Text style={styles.label}>Título:</Text>
                <Text style={styles.value}>{asset.title}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Descripción:</Text>
                <Text style={styles.value}>{asset.description || 'Sin descripción'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Fecha de Registro:</Text>
                <Text style={styles.value}>{formattedDate}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Rights Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Registro de Derechos y Licencia</Text>
          {asset.rightsRecord ? (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Tipo de Licencia:</Text>
                <Text style={styles.value}>
                  {LICENSE_LABELS[asset.rightsRecord.licenseType] || asset.rightsRecord.licenseType}
                </Text>
              </View>
              {asset.rightsRecord.sourceName && (
                <View style={styles.row}>
                  <Text style={styles.label}>Origen / Fuente:</Text>
                  <Text style={styles.value}>{asset.rightsRecord.sourceName}</Text>
                </View>
              )}
              {asset.rightsRecord.isAiGenerated && (
                <View style={styles.row}>
                  <Text style={styles.label}>Generado por IA:</Text>
                  <Text style={styles.value}>
                    Sí ({asset.rightsRecord.aiToolName || 'Herramienta no especificada'})
                  </Text>
                </View>
              )}
              <View style={styles.row}>
                <Text style={styles.label}>Estado Legal:</Text>
                <Text style={styles.value}>
                  {STATUS_LABELS[asset.rightsRecord.legalStatus] || asset.rightsRecord.legalStatus}
                </Text>
              </View>
              {asset.rightsRecord.notes && (
                <View style={styles.row}>
                  <Text style={styles.label}>Notas:</Text>
                  <Text style={styles.value}>{asset.rightsRecord.notes}</Text>
                </View>
              )}
            </>
          ) : (
            <Text style={{ fontStyle: 'italic', color: '#94a3b8' }}>
              No se han registrado datos de derechos para este asset.
            </Text>
          )}
        </View>

        {/* Sustainability Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Registro de Sustentabilidad</Text>
          {asset.sustainabilityRecord ? (
            <>
              {asset.sustainabilityRecord.material && (
                <View style={styles.row}>
                  <Text style={styles.label}>Material principal:</Text>
                  <Text style={styles.value}>{asset.sustainabilityRecord.material}</Text>
                </View>
              )}
              {asset.sustainabilityRecord.weightKg !== null && (
                <View style={styles.row}>
                  <Text style={styles.label}>Peso:</Text>
                  <Text style={styles.value}>{asset.sustainabilityRecord.weightKg} kg</Text>
                </View>
              )}
              {asset.sustainabilityRecord.estimatedCo2eqKg !== null && (
                <View style={styles.row}>
                  <Text style={styles.label}>Huella CO₂eq estimada:</Text>
                  <Text style={styles.value}>
                    {asset.sustainabilityRecord.estimatedCo2eqKg} kg CO₂eq
                  </Text>
                </View>
              )}
              <View style={styles.row}>
                <Text style={styles.label}>Resultado de Circularidad:</Text>
                <Text style={styles.value}>
                  {CIRCULARITY_LABELS[asset.sustainabilityRecord.circularityOutcome] ||
                    asset.sustainabilityRecord.circularityOutcome}
                </Text>
              </View>
              {asset.sustainabilityRecord.notes && (
                <View style={styles.row}>
                  <Text style={styles.label}>Notas Ambientales:</Text>
                  <Text style={styles.value}>{asset.sustainabilityRecord.notes}</Text>
                </View>
              )}
            </>
          ) : (
            <Text style={{ fontStyle: 'italic', color: '#94a3b8' }}>
              No se han registrado datos de sustentabilidad para este asset.
            </Text>
          )}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Documento generado automáticamente por TRACE Asset Lifecycle System — {todayFormatted}
        </Text>
      </Page>
    </Document>
  );
}
