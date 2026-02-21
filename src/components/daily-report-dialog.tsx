'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { BarChart3, ArrowDownLeft, ArrowUpRight, CheckCircle2, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface DailyStats {
  incomingMessages: number
  outgoingMessages: number
  sold: number
  dismissed: number
}

export function DailyReportDialog() {
  const [stats, setStats] = useState<DailyStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reports/daily')
      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      console.error('Failed to fetch daily stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchStats()
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-white hover:bg-white/20 gap-2">
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">Reporte Diario</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reporte del Día - {format(new Date(), 'dd MMM yyyy', { locale: es })}</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="py-8 text-center text-slate-500">Cargando reporte...</div>
        ) : stats ? (
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <ArrowDownLeft className="h-4 w-4" />
                <span className="text-sm font-medium">Entrantes</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">{stats.incomingMessages}</p>
              <p className="text-xs text-blue-500">Mensajes recibidos hoy</p>
            </div>

            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <ArrowUpRight className="h-4 w-4" />
                <span className="text-sm font-medium">Contestados</span>
              </div>
              <p className="text-2xl font-bold text-indigo-700">{stats.outgoingMessages}</p>
              <p className="text-xs text-indigo-500">Mensajes enviados hoy</p>
            </div>

            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Vendidos</span>
              </div>
              <p className="text-2xl font-bold text-green-700">{stats.sold}</p>
              <p className="text-xs text-green-500">Clientes marcados como venta</p>
            </div>

            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <XCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Anulados</span>
              </div>
              <p className="text-2xl font-bold text-red-700">{stats.dismissed}</p>
              <p className="text-xs text-red-500">Clientes descartados</p>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-red-500">Error al cargar datos</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
