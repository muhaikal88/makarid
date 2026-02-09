import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  reviewed: 'bg-blue-100 text-blue-700',
  interview: 'bg-indigo-100 text-indigo-700',
  hired: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700'
};

export const TrashTab = ({
  trashApps,
  language,
  handleRestoreApp,
  handlePermanentDeleteApp,
  getInitials,
  formatDate
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900" data-testid="trash-tab-title">
          <Trash2 className="w-5 h-5 inline mr-2 text-gray-400" />
          {language === 'id' ? 'Tempat Sampah' : 'Trash'}
          <span className="text-sm font-normal text-gray-400 ml-2">({trashApps.length})</span>
        </h2>
      </div>

      {trashApps.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {language === 'id'
            ? 'Lamaran di tempat sampah bisa dipulihkan atau dihapus secara permanen.'
            : 'Trashed applications can be restored or permanently deleted.'}
        </div>
      )}

      {trashApps.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <Trash2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500" data-testid="trash-empty-msg">
              {language === 'id' ? 'Tempat sampah kosong' : 'Trash is empty'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4" data-testid="trash-list">
          {trashApps.map(app => (
            <Card key={app.id} className="border-0 shadow-sm opacity-80" data-testid={`trash-card-${app.id}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 bg-gray-400">
                      <AvatarFallback className="bg-gray-400 text-white">
                        {getInitials(app.applicant_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-gray-700">{app.applicant_name}</h3>
                      <p className="text-sm text-gray-500">{app.applicant_email}</p>
                      <p className="text-sm text-gray-400 mt-1">{app.job_title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right mr-2">
                      <Badge className={statusColors[app.status] || 'bg-gray-100'}>
                        {app.status}
                      </Badge>
                      <p className="text-xs text-gray-400 mt-2">{formatDate(app.created_at)}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid={`restore-btn-${app.id}`}
                      onClick={() => handleRestoreApp(app.id)}
                      className="text-[#2E4DA7] border-[#2E4DA7]/30 hover:bg-[#2E4DA7]/5"
                    >
                      <RotateCcw className="w-4 h-4 mr-1.5" />
                      Pulihkan
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid={`permanent-delete-btn-${app.id}`}
                      onClick={() => handlePermanentDeleteApp(app.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1.5" />
                      Hapus Permanen
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
