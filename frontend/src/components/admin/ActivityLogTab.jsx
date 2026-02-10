import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Search, FileText, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const actionColors = {
  login: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  logout: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
  create: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  update: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  delete: 'bg-red-100 text-red-700 hover:bg-red-100',
};

const actionLabels = {
  login: 'Login',
  logout: 'Logout',
  create: 'Buat',
  update: 'Update',
  delete: 'Hapus',
};

const resourceLabels = {
  auth: 'Autentikasi',
  job: 'Lowongan',
  application: 'Lamaran',
  profile: 'Profil',
  company: 'Perusahaan',
};

const ITEMS_PER_PAGE = 50;

export const ActivityLogTab = ({ language }) => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterResource, setFilterResource] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchLogs = useCallback(async (page = currentPage) => {
    try {
      const params = new URLSearchParams();
      if (filterAction !== 'all') params.append('action', filterAction);
      if (filterResource !== 'all') params.append('resource_type', filterResource);
      if (searchTerm) params.append('search', searchTerm);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      params.append('skip', String((page - 1) * ITEMS_PER_PAGE));
      params.append('limit', String(ITEMS_PER_PAGE));

      const response = await axios.get(`${API}/logs/me?${params.toString()}`, {
        withCredentials: true,
      });
      setLogs(response.data.logs);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterAction, filterResource, searchTerm, startDate, endDate, currentPage]);

  useEffect(() => {
    fetchLogs(1);
    setCurrentPage(1);
  }, [filterAction, filterResource, startDate, endDate]);

  useEffect(() => {
    fetchLogs(currentPage);
  }, [currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchLogs(1);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs(currentPage);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterAction('all');
    setFilterResource('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="space-y-4" data-testid="activity-log-tab">
      {/* Filters */}
      <div className="flex flex-col gap-3">
        {/* Search + Refresh */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              data-testid="log-search-input"
              placeholder="Cari user, email, atau deskripsi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={handleSearch} data-testid="log-search-btn">
            <Search className="w-4 h-4 mr-2" />
            Cari
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing} data-testid="log-refresh-btn">
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="min-w-[150px]">
            <label className="text-xs text-gray-500 mb-1 block">Jenis Aksi</label>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger data-testid="log-filter-action">
                <SelectValue placeholder="Semua Aksi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Aksi</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="create">Buat</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Hapus</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[150px]">
            <label className="text-xs text-gray-500 mb-1 block">Resource</label>
            <Select value={filterResource} onValueChange={setFilterResource}>
              <SelectTrigger data-testid="log-filter-resource">
                <SelectValue placeholder="Semua Resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Resource</SelectItem>
                <SelectItem value="auth">Autentikasi</SelectItem>
                <SelectItem value="job">Lowongan</SelectItem>
                <SelectItem value="application">Lamaran</SelectItem>
                <SelectItem value="profile">Profil</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[150px]">
            <label className="text-xs text-gray-500 mb-1 block">Tanggal Mulai</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              data-testid="log-start-date"
            />
          </div>
          <div className="min-w-[150px]">
            <label className="text-xs text-gray-500 mb-1 block">Tanggal Akhir</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              data-testid="log-end-date"
            />
          </div>

          <Button variant="ghost" size="sm" onClick={handleResetFilters} data-testid="log-reset-filters">
            Reset Filter
          </Button>

          <div className="ml-auto text-sm text-gray-500 self-center">
            {total} log ditemukan
          </div>
        </div>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2E4DA7]"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">
                {searchTerm || filterAction !== 'all' || filterResource !== 'all' || startDate || endDate
                  ? 'Tidak ada log yang sesuai filter'
                  : 'Belum ada aktivitas tercatat'}
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
                  <TableHead className="font-semibold">Waktu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} data-testid={`log-row-${log.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8 bg-slate-200">
                          <AvatarFallback className="text-xs">{getInitials(log.user_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{log.user_name}</p>
                          <p className="text-xs text-gray-500">{log.user_email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={actionColors[log.action] || 'bg-gray-100 hover:bg-gray-100'}>
                        {actionLabels[log.action] || log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {resourceLabels[log.resource_type] || log.resource_type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-700 max-w-sm truncate">{log.description}</p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500 whitespace-nowrap">{formatTime(log.timestamp)}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {total > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between px-6 py-4 border-t" data-testid="log-pagination">
              <div className="text-sm text-gray-600">
                Halaman {currentPage} dari {totalPages} ({total} data)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  data-testid="log-prev-page"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Sebelumnya
                </Button>

                <div className="flex gap-1">
                  {getPageNumbers().map((num) => (
                    <Button
                      key={num}
                      variant={currentPage === num ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(num)}
                      className={currentPage === num ? 'bg-[#2E4DA7] hover:bg-[#2E4DA7]/90' : ''}
                    >
                      {num}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  data-testid="log-next-page"
                >
                  Selanjutnya
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
