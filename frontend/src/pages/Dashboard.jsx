import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Building2, Users, UserCheck, TrendingUp, ArrowRight, Clock } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

export const Dashboard = () => {
  const { t } = useLanguage();
  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await axios.get(`${API}/dashboard/stats`, {
          headers: getAuthHeaders(),
          timeout: 15000
        });
        setStats(response.data);
        return;
      } catch (error) {
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const statCards = [
    {
      title: t('totalCompanies'),
      value: stats?.total_companies || 0,
      icon: Building2,
      iconColor: 'text-[#2E4DA7]',
      bgLight: 'bg-blue-50'
    },
    {
      title: t('activeCompanies'),
      value: stats?.active_companies || 0,
      icon: TrendingUp,
      iconColor: 'text-emerald-500',
      bgLight: 'bg-emerald-50'
    },
    {
      title: t('totalUsers'),
      value: stats?.total_users || 0,
      icon: Users,
      iconColor: 'text-amber-500',
      bgLight: 'bg-amber-50'
    },
    {
      title: t('totalEmployees'),
      value: stats?.total_employees || 0,
      icon: UserCheck,
      iconColor: 'text-[#E31E24]',
      bgLight: 'bg-red-50'
    }
  ];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardLayout title={t('dashboard')}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E4DA7]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={t('dashboard')}>
      <div className="space-y-6" data-testid="dashboard-content">
        <div className="mb-2">
          <h2 className="text-2xl font-bold text-gray-800 font-['Manrope']" data-testid="welcome-message">
            {t('welcomeBack')}, Super Admin!
          </h2>
          <p className="text-gray-500 mt-1">{t('dashboardOverview')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow" data-testid={`stat-card-${index}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgLight}`}>
                    <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">{t('recentCompanies')}</CardTitle>
              <CardDescription>Latest registered companies</CardDescription>
            </div>
            <Button 
              variant="ghost" 
              className="text-[#2E4DA7] hover:text-[#2E4DA7]/80"
              onClick={() => navigate('/companies')}
              data-testid="view-all-companies"
            >
              {t('viewAll')} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {stats?.recent_companies?.length > 0 ? (
              <div className="space-y-4">
                {stats.recent_companies.map((company) => (
                  <div 
                    key={company.id} 
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    data-testid={`recent-company-${company.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#2E4DA7]/10 rounded-lg flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-[#2E4DA7]" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{company.name}</p>
                        <p className="text-sm text-gray-500">{company.domain}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Users className="w-4 h-4" />
                          <span>{company.employee_count} {t('employees')}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(company.created_at)}</span>
                        </div>
                      </div>
                      <Badge 
                        variant={company.is_active ? 'default' : 'secondary'}
                        className={company.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}
                      >
                        {company.is_active ? t('active') : t('inactive')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t('noCompanies')}</p>
                <Button 
                  className="mt-4 bg-[#2E4DA7] hover:bg-[#2E4DA7]/90"
                  onClick={() => navigate('/companies')}
                  data-testid="add-first-company"
                >
                  {t('addCompany')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};
