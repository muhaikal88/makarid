import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { 
  Building2, MapPin, Briefcase, Clock, ArrowLeft,
  Upload, Check, AlertCircle, DollarSign, Users,
  FileText, Send
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const jobTypeLabels = {
  full_time: { en: 'Full Time', id: 'Penuh Waktu' },
  part_time: { en: 'Part Time', id: 'Paruh Waktu' },
  contract: { en: 'Contract', id: 'Kontrak' },
  internship: { en: 'Internship', id: 'Magang' }
};

export const ApplyJob = () => {
  const { domain, jobId } = useParams();
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({});
  const [resume, setResume] = useState(null);
  
  // Wilayah API states
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [loadingWilayah, setLoadingWilayah] = useState(false);

  useEffect(() => {
    fetchJobDetail();
    fetchProvinces();
  }, [domain, jobId]);

  const fetchProvinces = async () => {
    try {
      const response = await axios.get('https://wilayah.id/api/provinces.json');
      setProvinces(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch provinces:', error);
    }
  };

  const fetchCities = async (provinceCode) => {
    setLoadingWilayah(true);
    try {
      const response = await axios.get(`https://wilayah.id/api/regencies/${provinceCode}.json`);
      setCities(response.data.data || []);
      setDistricts([]);
      setVillages([]);
    } catch (error) {
      console.error('Failed to fetch cities:', error);
    } finally {
      setLoadingWilayah(false);
    }
  };

  const fetchDistricts = async (cityCode) => {
    setLoadingWilayah(true);
    try {
      const response = await axios.get(`https://wilayah.id/api/districts/${cityCode}.json`);
      setDistricts(response.data.data || []);
      setVillages([]);
    } catch (error) {
      console.error('Failed to fetch districts:', error);
    } finally {
      setLoadingWilayah(false);
    }
  };

  const fetchVillages = async (districtCode) => {
    setLoadingWilayah(true);
    try {
      const response = await axios.get(`https://wilayah.id/api/villages/${districtCode}.json`);
      setVillages(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch villages:', error);
    } finally {
      setLoadingWilayah(false);
    }
  };

  const formatSalary = (value) => {
    // Remove non-numeric
    const numeric = value.replace(/\D/g, '');
    // Add thousand separator
    return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleFormChange = (fieldName, value) => {
    setFormData({ ...formData, [fieldName]: value });
    
    // Handle cascading dropdowns for wilayah.id API
    if (fieldName === 'province') {
      const province = provinces.find(p => p.name === value);
      if (province) {
        fetchCities(province.code);
        setFormData({
          ...formData,
          province: value,
          city: '',
          district: '',
          village: ''
        });
      }
    } else if (fieldName === 'city') {
      const city = cities.find(c => c.name === value);
      if (city) {
        fetchDistricts(city.code);
        setFormData({
          ...formData,
          city: value,
          district: '',
          village: ''
        });
      }
    } else if (fieldName === 'district') {
      const district = districts.find(d => d.name === value);
      if (district) {
        fetchVillages(district.code);
        setFormData({
          ...formData,
          district: value,
          village: ''
        });
      }
    }
  };

  useEffect(() => {
    fetchJobDetail();
  }, [domain, jobId]);

  const fetchJobDetail = async () => {
    try {
      const response = await axios.get(`${API}/public/careers/${domain}/jobs/${jobId}`);
      setData(response.data);
      
      // Initialize form data with empty values
      const initialData = {};
      response.data.form_fields.forEach(field => {
        if (field.field_type === 'checkbox') {
          initialData[field.field_name] = false;
        } else {
          initialData[field.field_name] = '';
        }
      });
      setFormData(initialData);
    } catch (err) {
      setError(err.response?.data?.detail || 'Job not found');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error(language === 'id' ? 'Hanya file PDF yang diizinkan' : 'Only PDF files are allowed');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(language === 'id' ? 'Ukuran file maksimal 5MB' : 'Maximum file size is 5MB');
        return;
      }
      setResume(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const missingFields = data.form_fields
      .filter(field => field.is_required && !formData[field.field_name] && field.field_type !== 'file')
      .map(field => field.field_label);
    
    if (missingFields.length > 0) {
      toast.error(
        language === 'id' 
          ? `Lengkapi field: ${missingFields.join(', ')}`
          : `Please fill: ${missingFields.join(', ')}`
      );
      return;
    }

    // Check if resume is required
    const resumeField = data.form_fields.find(f => f.field_type === 'file' && f.is_required);
    if (resumeField && !resume) {
      toast.error(language === 'id' ? 'CV/Resume wajib diupload' : 'Resume is required');
      return;
    }

    setSubmitting(true);
    
    try {
      const formPayload = new FormData();
      formPayload.append('job_id', jobId);
      formPayload.append('form_data', JSON.stringify(formData));
      if (resume) {
        formPayload.append('resume', resume);
      }

      await axios.post(`${API}/public/apply`, formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSubmitted(true);
      toast.success(
        language === 'id' 
          ? 'Lamaran berhasil dikirim!' 
          : 'Application submitted successfully!'
      );
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field) => {
    // Special handling for wilayah fields
    if (field.field_name === 'province') {
      return (
        <Select
          value={formData.province || ''}
          onValueChange={(value) => handleFormChange('province', value)}
        >
          <SelectTrigger data-testid="field-province">
            <SelectValue placeholder="Pilih Provinsi" />
          </SelectTrigger>
          <SelectContent>
            {provinces.map(prov => (
              <SelectItem key={prov.code} value={prov.name}>{prov.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    
    if (field.field_name === 'city') {
      return (
        <Select
          value={formData.city || ''}
          onValueChange={(value) => handleFormChange('city', value)}
          disabled={!formData.province || cities.length === 0}
        >
          <SelectTrigger data-testid="field-city">
            <SelectValue placeholder={cities.length === 0 ? 'Pilih provinsi dulu' : 'Pilih Kota/Kabupaten'} />
          </SelectTrigger>
          <SelectContent>
            {cities.map(city => (
              <SelectItem key={city.code} value={city.name}>{city.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    
    if (field.field_name === 'district') {
      return (
        <Select
          value={formData.district || ''}
          onValueChange={(value) => handleFormChange('district', value)}
          disabled={!formData.city || districts.length === 0}
        >
          <SelectTrigger data-testid="field-district">
            <SelectValue placeholder={districts.length === 0 ? 'Pilih kota dulu' : 'Pilih Kecamatan'} />
          </SelectTrigger>
          <SelectContent>
            {districts.map(dist => (
              <SelectItem key={dist.code} value={dist.name}>{dist.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    
    if (field.field_name === 'village') {
      return (
        <Select
          value={formData.village || ''}
          onValueChange={(value) => handleFormChange('village', value)}
          disabled={!formData.district || villages.length === 0}
        >
          <SelectTrigger data-testid="field-village">
            <SelectValue placeholder={villages.length === 0 ? 'Pilih kecamatan dulu' : 'Pilih Kelurahan/Desa'} />
          </SelectTrigger>
          <SelectContent>
            {villages.map(vil => (
              <SelectItem key={vil.code} value={vil.name}>{vil.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    
    // Special handling for salary (with thousand separator)
    if (field.field_name === 'expected_salary') {
      return (
        <Input
          type="tel"
          inputMode="numeric"
          id={field.field_name}
          value={formData[field.field_name] || ''}
          onChange={(e) => {
            const formatted = formatSalary(e.target.value);
            handleInputChange(field.field_name, formatted);
          }}
          placeholder="3.000.000"
          data-testid={`field-${field.field_name}`}
        />
      );
    }
    
    // Standard field types
    switch (field.field_type) {
      case 'date':
        return (
          <Input
            type="date"
            id={field.field_name}
            value={formData[field.field_name] || ''}
            onChange={(e) => handleInputChange(field.field_name, e.target.value)}
            data-testid={`field-${field.field_name}`}
          />
        );
      
      case 'number':
        return (
          <Input
            type="tel"
            inputMode="numeric"
            id={field.field_name}
            value={formData[field.field_name] || ''}
            onChange={(e) => handleInputChange(field.field_name, e.target.value)}
            placeholder={field.placeholder}
            data-testid={`field-${field.field_name}`}
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            id={field.field_name}
            value={formData[field.field_name] || ''}
            onChange={(e) => handleInputChange(field.field_name, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            data-testid={`field-${field.field_name}`}
          />
        );
      
      case 'select':
        return (
          <Select
            value={formData[field.field_name] || ''}
            onValueChange={(value) => handleInputChange(field.field_name, value)}
          >
            <SelectTrigger data-testid={`field-${field.field_name}`}>
              <SelectValue placeholder={field.placeholder || 'Select...'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.field_name}
              checked={formData[field.field_name] || false}
              onCheckedChange={(checked) => handleInputChange(field.field_name, checked)}
              data-testid={`field-${field.field_name}`}
            />
            <label htmlFor={field.field_name} className="text-sm text-gray-600">
              {field.placeholder || field.field_label}
            </label>
          </div>
        );
      
      case 'file':
        return (
          <div className="space-y-2">
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-[#2E4DA7] transition-colors">
              <input
                type="file"
                id={field.field_name}
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                data-testid={`field-${field.field_name}`}
              />
              <label htmlFor={field.field_name} className="cursor-pointer">
                {resume ? (
                  <div className="flex items-center justify-center gap-2 text-[#2E4DA7]">
                    <FileText className="w-8 h-8" />
                    <div>
                      <p className="font-medium">{resume.name}</p>
                      <p className="text-sm text-gray-500">
                        {(resume.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <p>{language === 'id' ? 'Klik untuk upload CV (PDF)' : 'Click to upload resume (PDF)'}</p>
                    <p className="text-xs mt-1">Max 5MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>
        );
      
      case 'date':
        return (
          <Input
            type="date"
            id={field.field_name}
            value={formData[field.field_name] || ''}
            onChange={(e) => handleInputChange(field.field_name, e.target.value)}
            data-testid={`field-${field.field_name}`}
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            id={field.field_name}
            value={formData[field.field_name] || ''}
            onChange={(e) => handleInputChange(field.field_name, e.target.value)}
            placeholder={field.placeholder}
            data-testid={`field-${field.field_name}`}
          />
        );
      
      default:
        return (
          <Input
            type={field.field_type === 'email' ? 'email' : field.field_type === 'phone' ? 'tel' : 'text'}
            id={field.field_name}
            value={formData[field.field_name] || ''}
            onChange={(e) => handleInputChange(field.field_name, e.target.value)}
            placeholder={field.placeholder}
            data-testid={`field-${field.field_name}`}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E4DA7]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {language === 'id' ? 'Lowongan Tidak Ditemukan' : 'Job Not Found'}
          </h1>
          <p className="text-gray-500 mb-4">{error}</p>
          <Link to={`/careers/${domain}`}>
            <Button className="bg-[#2E4DA7]">
              {language === 'id' ? 'Kembali ke Daftar Lowongan' : 'Back to Job List'}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-12 pb-8">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {language === 'id' ? 'Lamaran Terkirim!' : 'Application Submitted!'}
            </h1>
            <p className="text-gray-500 mb-6">
              {language === 'id'
                ? 'Terima kasih telah melamar. Tim HR kami akan menghubungi Anda jika kualifikasi Anda sesuai.'
                : 'Thank you for applying. Our HR team will contact you if your qualifications match.'}
            </p>
            <div className="flex flex-col gap-3">
              <Link to={`/careers/${domain}`}>
                <Button className="w-full bg-[#2E4DA7]">
                  {language === 'id' ? 'Lihat Lowongan Lainnya' : 'View Other Jobs'}
                </Button>
              </Link>
              <Link to={`/company/${domain}`}>
                <Button variant="outline" className="w-full">
                  {language === 'id' ? 'Tentang Perusahaan' : 'About Company'}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { company, job, form_fields } = data;

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-right" richColors />
      
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(`/careers/${domain}`)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                {company?.logo_url ? (
                  <img src={company.logo_url} alt={company.name} className="w-8 h-8 object-contain" />
                ) : (
                  <Building2 className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">{company?.name}</p>
                <h1 className="font-bold text-gray-800">{job?.title}</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job Details */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {language === 'id' ? 'Detail Lowongan' : 'Job Details'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    {jobTypeLabels[job?.job_type]?.[language] || job?.job_type}
                  </span>
                </div>
                {job?.department && (
                  <div className="flex items-center gap-3 text-sm">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{job.department}</span>
                  </div>
                )}
                {job?.location && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{job.location}</span>
                  </div>
                )}
                {job?.salary_min && (
                  <div className="flex items-center gap-3 text-sm">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      Rp {job.salary_min?.toLocaleString()}
                      {job.salary_max && ` - ${job.salary_max.toLocaleString()}`}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {language === 'id' ? 'Deskripsi' : 'Description'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 whitespace-pre-line">{job?.description}</p>
              </CardContent>
            </Card>

            {/* Requirements */}
            {job?.requirements && job.requirements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {language === 'id' ? 'Persyaratan' : 'Requirements'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {job.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-[#2E4DA7] rounded-full mt-2"></div>
                        {req}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Application Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-[#2E4DA7]" />
                  {language === 'id' ? 'Form Lamaran' : 'Application Form'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {form_fields.map(field => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.field_name}>
                        {field.field_label}
                        {field.is_required && <span className="text-[#E31E24] ml-1">*</span>}
                      </Label>
                      {renderField(field)}
                    </div>
                  ))}

                  <div className="pt-4 border-t">
                    <Button 
                      type="submit" 
                      className="w-full bg-[#2E4DA7] hover:bg-[#2E4DA7]/90 h-12"
                      disabled={submitting}
                      data-testid="submit-application"
                    >
                      {submitting ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                          {language === 'id' ? 'Mengirim...' : 'Submitting...'}
                        </span>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          {language === 'id' ? 'Kirim Lamaran' : 'Submit Application'}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
