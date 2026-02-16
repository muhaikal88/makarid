import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
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

export const JobFormDialog = ({
  isOpen,
  onClose,
  selectedJob,
  jobFormData,
  setJobFormData,
  handleSubmit,
  language
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="job-form-title">
            {selectedJob
              ? (language === 'id' ? 'Edit Lowongan' : 'Edit Job')
              : (language === 'id' ? 'Tambah Lowongan Baru' : 'Add New Job')}
          </DialogTitle>
          <DialogDescription>
            {language === 'id'
              ? 'Isi informasi lowongan pekerjaan'
              : 'Fill in the job posting information'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} data-testid="job-form">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Judul Lowongan *</Label>
              <Input
                id="title"
                data-testid="job-title-input"
                value={jobFormData.title}
                onChange={(e) => setJobFormData({ ...jobFormData, title: e.target.value })}
                placeholder="e.g. Software Engineer"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="department">Departemen</Label>
                <Input
                  id="department"
                  data-testid="job-department-input"
                  value={jobFormData.department}
                  onChange={(e) => setJobFormData({ ...jobFormData, department: e.target.value })}
                  placeholder="e.g. Engineering"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Lokasi</Label>
                <Input
                  id="location"
                  data-testid="job-location-input"
                  value={jobFormData.location}
                  onChange={(e) => setJobFormData({ ...jobFormData, location: e.target.value })}
                  placeholder="e.g. Jakarta"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="job_type">Tipe Pekerjaan</Label>
              <Select
                value={jobFormData.job_type}
                onValueChange={(value) => setJobFormData({ ...jobFormData, job_type: value })}
              >
                <SelectTrigger data-testid="job-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full Time</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Deskripsi Pekerjaan *</Label>
              <Textarea
                id="description"
                data-testid="job-description-input"
                value={jobFormData.description}
                onChange={(e) => setJobFormData({ ...jobFormData, description: e.target.value })}
                placeholder="Jelaskan tanggung jawab dan kualifikasi..."
                rows={6}
                required
              />
            </div>

            {/* Salary Range */}
            <div className="grid gap-2">
              <Label>Range Gaji (Opsional)</Label>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  type="number"
                  data-testid="job-salary-min-input"
                  value={jobFormData.salary_min}
                  onChange={(e) => setJobFormData({ ...jobFormData, salary_min: e.target.value })}
                  placeholder="Min (e.g. 3000000)"
                />
                <Input
                  type="number"
                  data-testid="job-salary-max-input"
                  value={jobFormData.salary_max}
                  onChange={(e) => setJobFormData({ ...jobFormData, salary_max: e.target.value })}
                  placeholder="Max (e.g. 4500000)"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="show_salary"
                  data-testid="job-show-salary-checkbox"
                  checked={jobFormData.show_salary}
                  onChange={(e) => setJobFormData({ ...jobFormData, show_salary: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="show_salary" className="text-sm cursor-pointer">
                  Tampilkan gaji di halaman publik
                </Label>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={jobFormData.status}
                onValueChange={(value) => setJobFormData({ ...jobFormData, status: value })}
              >
                <SelectTrigger data-testid="job-status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft (Belum Dipublikasi)</SelectItem>
                  <SelectItem value="published">Published (Aktif)</SelectItem>
                  <SelectItem value="closed">Closed (Ditutup)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Allow existing applicant setting */}
            <div className="p-4 bg-slate-50 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allow_existing"
                  data-testid="job-allow-existing-checkbox"
                  checked={jobFormData.allow_existing_applicant !== false}
                  onChange={(e) => setJobFormData({ ...jobFormData, allow_existing_applicant: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="allow_existing" className="text-sm cursor-pointer font-medium">
                  Izinkan pelamar dari lowongan lain
                </Label>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                Jika dicentang, pelamar yang sudah melamar di posisi lain di perusahaan Anda tetap bisa melamar di lowongan ini. Jika tidak dicentang, pelamar yang sudah melamar di posisi lain tidak bisa melamar lagi.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose(false)} data-testid="job-form-cancel-btn">
              Batal
            </Button>
            <Button type="submit" className="bg-[#2E4DA7] hover:bg-[#2E4DA7]/90" data-testid="job-form-submit-btn">
              {selectedJob ? 'Update' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
