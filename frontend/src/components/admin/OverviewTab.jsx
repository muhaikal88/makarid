import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  Briefcase, Eye, FileText, Clock, Shield, AlertTriangle
} from 'lucide-react';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  reviewing: 'bg-blue-100 text-blue-700',
  shortlisted: 'bg-purple-100 text-purple-700',
  interviewed: 'bg-indigo-100 text-indigo-700',
  offered: 'bg-emerald-100 text-emerald-700',
  hired: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700'
};

export const OverviewTab = ({ stats, applications, session, language, formatDate, getInitials }) => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  {language === 'id' ? 'Total Lowongan' : 'Total Jobs'}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalJobs}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Briefcase className="w-6 h-6 text-[#2E4DA7]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  {language === 'id' ? 'Lowongan Aktif' : 'Active Jobs'}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.publishedJobs}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <Eye className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  {language === 'id' ? 'Total Lamaran' : 'Total Applications'}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalApplications}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <FileText className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  {language === 'id' ? 'Menunggu Review' : 'Pending Review'}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pendingApplications}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* License Info */}
      {session?.license_end && (
        <Card className={`border-0 shadow-sm ${
          session?.license_status === 'expired' ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200' :
          session?.days_remaining !== null && session?.days_remaining <= 30 ? 'bg-gradient-to-r from-amber-50 to-yellow-50' :
          'bg-gradient-to-r from-emerald-50 to-teal-50'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl shadow-sm ${
                session?.license_status === 'expired' ? 'bg-red-100' :
                session?.days_remaining !== null && session?.days_remaining <= 30 ? 'bg-amber-100' : 'bg-emerald-100'
              }`}>
                {session?.license_status === 'expired' ? (
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                ) : (
                  <Shield className="w-6 h-6 text-emerald-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">
                    {language === 'id' ? 'Status Lisensi' : 'License Status'}
                  </h3>
                  <Badge className={
                    session?.license_status === 'expired' ? 'bg-red-100 text-red-700' :
                    session?.license_status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-gray-100 text-gray-700'
                  }>
                    {session?.license_type === 'lifetime' ? 'Lifetime' :
                     session?.license_status === 'expired' ? 'Expired' : 'Aktif'}
                  </Badge>
                </div>
                {session?.days_remaining !== null && session?.license_type !== 'lifetime' && (
                  <p className={`text-sm ${
                    session?.license_status === 'expired' ? 'text-red-600 font-medium' :
                    session?.days_remaining <= 30 ? 'text-amber-700' : 'text-gray-600'
                  }`}>
                    {session?.license_status === 'expired'
                      ? (language === 'id' ? 'Lisensi telah berakhir. Hubungi administrator untuk perpanjangan.' : 'License has expired. Contact administrator to renew.')
                      : (language === 'id' ? `Sisa ${session.days_remaining} hari lagi` : `${session.days_remaining} days remaining`)
                    }
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Applications */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle data-testid="recent-applications-title">
            {language === 'id' ? 'Lamaran Terbaru' : 'Recent Applications'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <p className="text-center text-gray-500 py-8" data-testid="no-applications-msg">
              {language === 'id' ? 'Belum ada lamaran' : 'No applications yet'}
            </p>
          ) : (
            <div className="space-y-4" data-testid="recent-applications-list">
              {applications.slice(0, 5).map(app => (
                <div key={app.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Avatar className="bg-[#2E4DA7]">
                      <AvatarFallback className="bg-[#2E4DA7] text-white">
                        {getInitials(app.applicant_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">{app.applicant_name}</p>
                      <p className="text-sm text-gray-500">{app.job_title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={statusColors[app.status] || 'bg-gray-100'}>
                      {app.status}
                    </Badge>
                    <span className="text-sm text-gray-400">{formatDate(app.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
