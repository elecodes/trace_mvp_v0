'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteProject } from '@/lib/actions/project-actions';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface DeleteProjectButtonProps {
  projectId: string;
}

export function DeleteProjectButton({ projectId }: DeleteProjectButtonProps) {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que querés eliminar este proyecto? Se eliminarán también todos los assets asociados de forma definitiva. Esta acción no se puede deshacer.')) {
      return;
    }
    setDeleting(true);
    try {
      await deleteProject(projectId);
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el proyecto');
      setDeleting(false);
    }
  };

  return (
    <Button
      variant="destructive"
      onClick={handleDelete}
      disabled={deleting}
      className="bg-red-600 hover:bg-red-700 text-white cursor-pointer gap-2 shrink-0 font-semibold h-9"
    >
      <Trash2 className="h-4 w-4" />
      {deleting ? 'Eliminando...' : 'Eliminar Proyecto'}
    </Button>
  );
}
