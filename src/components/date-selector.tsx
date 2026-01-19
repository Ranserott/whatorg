'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { format, addDays, subDays, isToday, parseISO } from 'date-fns'

interface DateInfo {
  date: string
  messageCount: number
}

interface DateSelectorProps {
  selectedDate: string
  onDateChange: (date: string) => void
}

export function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  const [availableDates, setAvailableDates] = useState<DateInfo[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    fetchAvailableDates()
  }, [])

  const fetchAvailableDates = async () => {
    try {
      const response = await fetch('/api/messages/dates')
      const data = await response.json()
      setAvailableDates(data.dates || [])
    } catch (error) {
      console.error('Failed to fetch dates:', error)
    }
  }

  const goToPreviousDay = () => {
    const currentDate = parseISO(selectedDate)
    const previousDay = subDays(currentDate, 1)
    onDateChange(format(previousDay, 'yyyy-MM-dd'))
  }

  const goToNextDay = () => {
    const currentDate = parseISO(selectedDate)
    const nextDay = addDays(currentDate, 1)
    onDateChange(format(nextDay, 'yyyy-MM-dd'))
  }

  const canGoNext = () => {
    return !isToday(parseISO(selectedDate))
  }

  const hasDateMessages = (dateStr: string) => {
    return availableDates.some(d => d.date === dateStr)
  }

  const getDisplayDate = () => {
    const date = new Date(selectedDate)
    if (isToday(date)) return 'Hoy'
    return format(date, 'dd MMM yyyy')
  }

  const getMessageCount = () => {
    const dateInfo = availableDates.find(d => d.date === selectedDate)
    return dateInfo?.messageCount || 0
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {/* Previous Day Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPreviousDay}
          className="h-9 w-9 text-white hover:bg-white/20"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Current Date Display */}
        <Button
          variant="ghost"
          onClick={() => setIsOpen(!isOpen)}
          className="min-w-[140px] justify-between bg-white/20 text-white hover:bg-white/30"
        >
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {getDisplayDate()}
          </span>
          {getMessageCount() > 0 && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full text-white">
              {getMessageCount()}
            </span>
          )}
        </Button>

        {/* Next Day Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextDay}
          disabled={!canGoNext()}
          className="h-9 w-9 text-white hover:bg-white/20 disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Date Picker Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 z-20 bg-white/95 backdrop-blur-sm border border-blue-200 rounded-lg shadow-xl w-64 max-h-64 overflow-hidden">
            <div className="p-3 border-b border-blue-100">
              <p className="text-sm font-medium text-slate-700">Fechas con mensajes</p>
            </div>
            <div className="overflow-y-auto max-h-48">
              {availableDates.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  No hay fechas disponibles
                </div>
              ) : (
                availableDates.map((dateInfo) => (
                  <button
                    key={dateInfo.date}
                    onClick={() => {
                      onDateChange(dateInfo.date)
                      setIsOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-blue-50 transition-colors text-left ${
                      dateInfo.date === selectedDate ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <span className="text-sm text-slate-700">
                      {isToday(new Date(dateInfo.date))
                        ? 'Hoy'
                        : format(new Date(dateInfo.date), 'dd MMM yyyy')
                      }
                    </span>
                    <span className="text-xs text-slate-500">
                      {dateInfo.messageCount} msj
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
