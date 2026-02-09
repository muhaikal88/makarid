import React from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { FileText } from 'lucide-react';

export const AppDetailDialog = ({
  isOpen,
  onClose,
  selectedApp,
  handleUpdateStatus,
  getInitials
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" data-testid="app-detail-title">
            <FileText className="w-5 h-5 text-[#2E4DA7]" />
            Detail Lamaran
          </DialogTitle>
          <DialogDescription>
            {selectedApp?.job_title}
          </DialogDescription>
        </DialogHeader>

        {selectedApp && (
          <div className="space-y-6 py-4" data-testid="app-detail-content">
            {/* Applicant Info */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
              <Avatar className="w-16 h-16 bg-[#2E4DA7]">
                <AvatarFallback className="bg-[#2E4DA7] text-white text-xl">
                  {getInitials(selectedApp.form_data?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-lg" data-testid="app-detail-name">{selectedApp.form_data?.full_name}</h3>
                <p className="text-sm text-gray-600">{selectedApp.form_data?.email}</p>
                <p className="text-sm text-gray-600">{selectedApp.form_data?.phone}</p>
              </div>
            </div>

            {/* Status Update */}
            <div className="space-y-2">
              <Label>Status Lamaran</Label>
              <Select
                value={selectedApp.status}
                onValueChange={(value) => handleUpdateStatus(selectedApp.id, value)}
              >
                <SelectTrigger data-testid="app-status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending (Baru Masuk)</SelectItem>
                  <SelectItem value="reviewed">Reviewed (Sudah Dilihat)</SelectItem>
                  <SelectItem value="interview">Interview (Panggilan Interview)</SelectItem>
                  <SelectItem value="hired">Hired (Diterima)</SelectItem>
                  <SelectItem value="rejected">Rejected (Ditolak)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Personal Info */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Informasi Pribadi</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                {selectedApp.form_data?.birth_place && (
                  <div>
                    <span className="text-gray-500">Tempat Lahir:</span>
                    <p className="font-medium">{selectedApp.form_data.birth_place}</p>
                  </div>
                )}
                {selectedApp.form_data?.birth_date && (
                  <div>
                    <span className="text-gray-500">Tanggal Lahir:</span>
                    <p className="font-medium">{selectedApp.form_data.birth_date}</p>
                  </div>
                )}
                {selectedApp.form_data?.education && (
                  <div>
                    <span className="text-gray-500">Pendidikan:</span>
                    <p className="font-medium">{selectedApp.form_data.education}</p>
                  </div>
                )}
                {selectedApp.form_data?.major && (
                  <div>
                    <span className="text-gray-500">Jurusan:</span>
                    <p className="font-medium">{selectedApp.form_data.major}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Address */}
            {(selectedApp.form_data?.province || selectedApp.form_data?.full_address) && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Domisili</h4>
                <div className="space-y-2 text-sm">
                  {selectedApp.form_data.province && (
                    <p><span className="text-gray-500">Provinsi:</span> <span className="font-medium">{selectedApp.form_data.province}</span></p>
                  )}
                  {selectedApp.form_data.city && (
                    <p><span className="text-gray-500">Kota/Kab:</span> <span className="font-medium">{selectedApp.form_data.city}</span></p>
                  )}
                  {selectedApp.form_data.district && (
                    <p><span className="text-gray-500">Kecamatan:</span> <span className="font-medium">{selectedApp.form_data.district}</span></p>
                  )}
                  {selectedApp.form_data.village && (
                    <p><span className="text-gray-500">Kelurahan:</span> <span className="font-medium">{selectedApp.form_data.village}</span></p>
                  )}
                  {selectedApp.form_data.full_address && (
                    <div className="p-3 bg-slate-50 rounded">
                      <p className="text-gray-700">{selectedApp.form_data.full_address}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Salary */}
            {selectedApp.form_data?.expected_salary && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Ekspektasi Gaji</h4>
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-700" data-testid="app-expected-salary">
                    Rp {selectedApp.form_data.expected_salary}
                  </p>
                </div>
              </div>
            )}

            {/* CV */}
            {selectedApp.resume_url && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Curriculum Vitae</h4>
                <Button
                  variant="outline"
                  data-testid="download-cv-btn"
                  onClick={() => window.open(selectedApp.resume_url, '_blank')}
                  className="w-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Download CV
                </Button>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onClose(false)} data-testid="app-detail-close-btn">
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
