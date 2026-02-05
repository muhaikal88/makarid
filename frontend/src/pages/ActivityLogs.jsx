import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { 
  Search, 
  FileText, 
  User, 
  Building2,
  RefreshCw,
  Filter
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const actionColors = {
  login: 'bg-blue-100 text-blue-700',
  logout: 'bg-gray-100 text-gray-700',
  create: 'bg-emerald-100 text-emerald-700',
  update: 'bg-amber-100 text-amber-700',
  delete: 'bg-red-100 text-red-700'
};

const actionIcons = {
  login: '🔑',
  logout: '🚪',
  create: '➕',
  update: '✏️',
  delete: '🗑️'
};

export const ActivityLogs = () => {
  const { language } = useLanguage();
  const { getAuthHeaders } = useAuth();
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterResource, setFilterResource] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (filterAction !== 'all') params.append('action', filterAction);
      if (filterResource !== 'all') params.append('resource_type', filterResource);
      if (filterUser !== 'all') params.append('user_id', filterUser);
      if (searchTerm) params.append('search', searchTerm);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      params.append('limit', '500');
      
      const response = await axios.get(`${API}/logs?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      setLogs(response.data);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchLogs();
  };

  const filteredLogs = logs;
  
  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterAction, filterResource, filterUser, startDate, endDate]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  // Get unique users for filter
  const uniqueUsers = [...new Map(logs.map(log => [log.user_id, { id: log.user_id, name: log.user_name, email: log.user_email }])).values()];

  return (
    <DashboardLayout title={language === 'id' ? 'Log Aktivitas' : 'Activity Logs'}>
      <div className="space-y-6">
        {/* Header with Filters */}
        <div className="flex flex-col gap-4">
          {/* Search and Refresh */}
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={language === 'id' ? 'Cari user, email, atau deskripsi...' : 'Search user, email, or description...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              {language === 'id' ? 'Cari' : 'Search'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {language === 'id' ? 'Refresh' : 'Refresh'}
            </Button>
          </div>

          {/* Filters Row 1: Date Range */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 max-w-xs">
              <Label className="text-sm text-gray-600 mb-2 block">Tanggal Mulai</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); }}
                className="h-10"
              />
            </div>
            <div className="flex-1 max-w-xs">
              <Label className="text-sm text-gray-600 mb-2 block">Tanggal Akhir</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); }}
                className="h-10"
              />
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  fetchLogs();
                }}
                className="h-10"
              >
                Reset Tanggal
              </Button>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={fetchLogs}
                className="h-10 bg-[#2E4DA7] hover:bg-[#2E4DA7]/90"
              >
                Terapkan Filter
              </Button>
            </div>
          </div>

          {/* Filters Row 2: Action, Resource, User */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Action Filter */}
            <div className="flex-1 max-w-xs">
              <Select value={filterAction} onValueChange={(value) => { setFilterAction(value); fetchLogs(); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter Aksi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Aksi</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Resource Type Filter */}
            <div className="flex-1 max-w-xs">
              <Select value={filterResource} onValueChange={(value) => { setFilterResource(value); fetchLogs(); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter Resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Resource</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="job">Job Posting</SelectItem>
                  <SelectItem value="application">Application</SelectItem>
                  <SelectItem value="license">License</SelectItem>
                  <SelectItem value="profile">Profile</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* User Filter */}
            <div className="flex-1 max-w-xs">
              <Select value={filterUser} onValueChange={(value) => { setFilterUser(value); fetchLogs(); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter User" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua User</SelectItem>
                  {uniqueUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Result count */}
            <div className="flex items-center px-4 py-2 bg-slate-50 rounded-lg text-sm text-gray-600">
              {paginatedLogs.length} dari {filteredLogs.length} log
            </div>
          </div>
        </div>

        {/* Table */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2E4DA7]"></div>
              </div>
            ) : paginatedLogs.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">
                  {searchTerm || filterAction !== 'all' || filterResource !== 'all' 
                    ? (language === 'id' ? 'Tidak ada log yang sesuai filter' : 'No logs match the filters')
                    : (language === 'id' ? 'Belum ada aktivitas' : 'No activity yet')}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold">User</TableHead>
                    <TableHead className="font-semibold">Aksi</TableHead>
                    <TableHead className="font-semibold">Resource</TableHead>
                    <TableHead className="font-semibold">Deskripsi</TableHead>
                    <TableHead className="font-semibold">Perusahaan</TableHead>
                    <TableHead className="font-semibold">Waktu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8 bg-slate-200">
                            <AvatarFallback className="text-xs">
                              {getInitials(log.user_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{log.user_name}</p>
                            <p className="text-xs text-gray-500">{log.user_email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={actionColors[log.action] || 'bg-gray-100'}>
                          <span className="mr-1">{actionIcons[log.action]}</span>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{log.resource_type}</span>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-700 max-w-md truncate">
                          {log.description}
                        </p>
                      </TableCell>
                      <TableCell>
                        {log.company_name ? (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Building2 className="w-3 h-3" />
                            <span className="text-sm">{log.company_name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{formatTime(log.timestamp)}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            {filteredLogs.length > itemsPerPage && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-gray-600">
                  Halaman {currentPage} dari {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Sebelumnya
                  </Button>
                  
                  <div className="flex gap-1">
                    {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = idx + 1;
                      } else if (currentPage <= 3) {
                        pageNum = idx + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + idx;
                      } else {
                        pageNum = currentPage - 2 + idx;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={currentPage === pageNum ? "bg-[#2E4DA7] hover:bg-[#2E4DA7]/90" : ""}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};
