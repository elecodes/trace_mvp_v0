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
    justify: 'space-between',
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

interface AssetPdfProps {
  asset: {
    id: string;
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    status: string;
    createdAt: Date;
    project: { name: string };
    rightsRecord?: {
      licenseType: string;
      ownerName: string;
      terms?: string | null;
      expirationDate?: Date | null;
      isDocumented: boolean;
    } | null;
    sustainabilityRecord?: {
      carbonFootprintKg: number;
      weightKg: number;
      recyclablePercent: number;
      notes?: string | null;
    } | null;
  };
}

export function AssetPdfDocument({ asset }: AssetPdfProps) {
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
          <Text style={styles.badge}>Estado: {asset.status}</Text>
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
                <Text style={styles.value}>
                  {new Date(asset.createdAt).toLocaleDateString('es-AR')}
                </Text>
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
                <Text style={styles.value}>{asset.rightsRecord.licenseType}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Titular de Derechos:</Text>
                <Text style={styles.value}>{asset.rightsRecord.ownerName}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Estado de Verificación:</Text>
                <Text style={styles.value}>
                  {asset.rightsRecord.isDocumented ? 'VERIFICADO / DOCUMENTADO' : 'PENDIENTE'}
                </Text>
              </View>
              {asset.rightsRecord.terms && (
                <View style={styles.row}>
                  <Text style={styles.label}>Términos:</Text>
                  <Text style={styles.value}>{asset.rightsRecord.terms}</Text>
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
              <View style={styles.row}>
                <Text style={styles.label}>Huella de Carbono:</Text>
                <Text style={styles.value}>
                  {asset.sustainabilityRecord.carbonFootprintKg} kg CO₂eq
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Peso Total:</Text>
                <Text style={styles.value}>{asset.sustainabilityRecord.weightKg} kg</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Reciclabilidad:</Text>
                <Text style={styles.value}>
                  {asset.sustainabilityRecord.recyclablePercent}% del total
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
          Documento generado automáticamente por TRACE Asset Lifecycle System — {new Date().toLocaleDateString('es-AR')}
        </Text>
      </Page>
    </Document>
  );
}
