"use client"

import { useEffect, useState } from "react"

export type TurnoFase = "inactivo" | "normal" | "alerta" | "peligro" | "vencido"

interface TurnoCountdown {
  activo: boolean
  tiempoRestante: string
  porcentajeTranscurrido: number
  mensaje: string
  fase: TurnoFase
}

function calcularTiempoRestante(
  horaInicio: string,
  horaFin: string
): { horas: number; minutos: number; segundos: number; porcentaje: number; activo: boolean } {
  const ahora = new Date()
  const [inicioH, inicioM] = horaInicio.split(":").map(Number)
  const [finH, finM] = horaFin.split(":").map(Number)

  const inicio = new Date(ahora)
  inicio.setHours(inicioH, inicioM, 0, 0)

  const fin = new Date(ahora)
  fin.setHours(finH, finM, 0, 0)

  if (fin <= inicio) {
    fin.setDate(fin.getDate() + 1)
  }

  if (ahora < inicio) {
    const diff = inicio.getTime() - ahora.getTime()
    const horas = Math.floor(diff / 3600000)
    const minutos = Math.floor((diff % 3600000) / 60000)
    const segundos = Math.floor((diff % 60000) / 1000)
    return { horas, minutos, segundos, porcentaje: 0, activo: false }
  }

  if (ahora >= fin) {
    return { horas: 0, minutos: 0, segundos: 0, porcentaje: 100, activo: false }
  }

  const totalDuracion = fin.getTime() - inicio.getTime()
  const transcurrido = ahora.getTime() - inicio.getTime()
  const restante = fin.getTime() - ahora.getTime()

  const horas = Math.floor(restante / 3600000)
  const minutos = Math.floor((restante % 3600000) / 60000)
  const segundos = Math.floor((restante % 60000) / 1000)
  const porcentaje = Math.round((transcurrido / totalDuracion) * 100)

  return { horas, minutos, segundos, porcentaje, activo: true }
}

export function useTurnoCountdown(
  horaInicioTurno?: string | null,
  horaFinTurno?: string | null
): TurnoCountdown {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!horaInicioTurno || !horaFinTurno) return
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [horaInicioTurno, horaFinTurno])

  if (!horaInicioTurno || !horaFinTurno) {
    return {
      activo: false,
      tiempoRestante: "Sin turno",
      porcentajeTranscurrido: 0,
      mensaje: "No tiene turno asignado",
      fase: "inactivo",
    }
  }

  const { horas, minutos, segundos, porcentaje, activo } = calcularTiempoRestante(
    horaInicioTurno,
    horaFinTurno
  )

  if (!activo && porcentaje === 0) {
    const tiempoRestante = `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`
    return {
      activo: false,
      tiempoRestante,
      porcentajeTranscurrido: 0,
      mensaje: `Turno inicia en ${tiempoRestante}`,
      fase: "inactivo",
    }
  }

  if (!activo && porcentaje === 100) {
    return {
      activo: false,
      tiempoRestante: "00:00:00",
      porcentajeTranscurrido: 100,
      mensaje: "Turno finalizado",
      fase: "vencido",
    }
  }

  const tiempoRestante = `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`

  let fase: TurnoFase = "normal"
  if (porcentaje >= 90) fase = "peligro"
  else if (porcentaje >= 75) fase = "alerta"

  return {
    activo: true,
    tiempoRestante,
    porcentajeTranscurrido: porcentaje,
    mensaje: `Finaliza en ${tiempoRestante}`,
    fase,
  }
}
