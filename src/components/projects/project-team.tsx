'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addProjectMember, removeProjectMember } from '@/lib/actions/team-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, UserPlus, Trash2, Shield, Eye, Palette } from 'lucide-react';
import { ProjectRole } from '@prisma/client';

interface TeamMember {
  id: string;
  role: ProjectRole;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

interface ProjectTeamProps {
  projectId: string;
  members: TeamMember[];
  userRole?: ProjectRole;
}

const ROLE_LABELS: Record<ProjectRole, string> = {
  PRODUCER: 'Productor',
  ART: 'Arte / Decorador',
  LEGAL: 'Legal / Derechos',
};

const ROLE_ICONS: Record<ProjectRole, React.ReactNode> = {
  PRODUCER: <Shield className="h-3 w-3 text-amber-600" />,
  ART: <Palette className="h-3 w-3 text-blue-600" />,
  LEGAL: <Eye className="h-3 w-3 text-emerald-600" />,
};

const ROLE_COLORS: Record<ProjectRole, string> = {
  PRODUCER: 'bg-amber-50 text-amber-700 border-amber-200',
  ART: 'bg-blue-50 text-blue-700 border-blue-200',
  LEGAL: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export function ProjectTeam({ projectId, members, userRole }: ProjectTeamProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ProjectRole>('ART');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await addProjectMember(projectId, email.trim(), role);
      setEmail('');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error al agregar miembro');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('¿Estás seguro de que querés remover a este miembro del equipo?')) return;
    try {
      await removeProjectMember(projectId, memberId);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Error al remover miembro');
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Users className="h-4.5 w-4.5 text-emerald-600" /> Equipo del Proyecto
        </CardTitle>
        <CardDescription className="text-xs">
          Administrá el equipo colaborativo y asigná sus roles de producción.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Members List */}
        <div className="space-y-2">
          {members.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No hay otros miembros en este equipo.</p>
          ) : (
            members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                    {(member.user.name || member.user.email).slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">{member.user.name || member.user.email}</div>
                    <div className="text-[10px] text-slate-400">{member.user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ROLE_COLORS[member.role]}`}>
                    {ROLE_ICONS[member.role]}
                    {ROLE_LABELS[member.role]}
                  </span>
                  {userRole === 'PRODUCER' && !member.id.startsWith('owner-') && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Member Form */}
        {userRole === 'PRODUCER' && (
          <form onSubmit={handleAddMember} className="border-t pt-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <UserPlus className="h-3.5 w-3.5 text-slate-500" /> Agregar Colaborador
            </h4>
            {error && <p className="text-[10px] text-red-500">{error}</p>}
            <div className="space-y-2">
              <div>
                <Label htmlFor="member-email" className="text-[10px] font-semibold text-slate-500">Email de Usuario *</Label>
                <Input
                  id="member-email"
                  type="email"
                  placeholder="ejemplo@trace.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label htmlFor="member-role" className="text-[10px] font-semibold text-slate-500">Rol del Miembro</Label>
                <select
                  id="member-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as ProjectRole)}
                  className="w-full h-8 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus-visible:outline-none mt-1"
                >
                  <option value="PRODUCER">Productor</option>
                  <option value="ART">Arte / Decorador</option>
                  <option value="LEGAL">Legal / Derechos</option>
                </select>
              </div>
              <Button
                type="submit"
                disabled={loading || !email}
                className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer font-semibold"
              >
                {loading ? 'Agregando...' : 'Invitar al Equipo'}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
