import { getProjects } from '@/lib/actions/asset-actions';
import { AssetForm } from '@/components/assets/asset-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default async function NewAssetPage() {
  const projects = await getProjects();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Crear Nuevo Asset</h1>
        <p className="text-sm text-slate-500">
          Registrá un nuevo activo e inicializalo en fase de Concepción / Diseño.
        </p>
      </div>

      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Formulario de Asset</CardTitle>
          <CardDescription>
            Cargá los datos primarios y adjuntá su foto. Se optimizará en el navegador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AssetForm projects={projects} />
        </CardContent>
      </Card>
    </div>
  );
}
