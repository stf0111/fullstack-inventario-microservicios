import { Component, OnDestroy, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';

import {
  ConfiguracionService,
  ConfiguracionDto,
  ConfiguracionCrearDto,
  ConfiguracionEditarDto
} from '../../../servicios/configuracion.service';

@Component({
  selector: 'app-configuracion-inicio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracion-inicio.html',
  styleUrls: ['./configuracion-inicio.css']
})
export class ConfiguracionInicio implements OnInit, OnDestroy {
  private configService = inject(ConfiguracionService);
  private cdRef = inject(ChangeDetectorRef);
  private router = inject(Router);

  cargando = false;
  mensajeError = '';
  mensajeOk = '';

  modoCrear = true;
  configId: number | null = null;

  form: ConfiguracionCrearDto = {
    ivaPorcentaje: 15,
    establecimiento: '001',
    puntoEmision: '001',
    ultimoSecuencial: 0
  };

  numeroSiguientePreview = '';

  modalOkVisible = false;
  modalOkMensaje = '';
  private okTimer: any = null;

  ngOnInit(): void {
    this.cargar();
  }

  ngOnDestroy(): void {
    if (this.okTimer) {
      clearTimeout(this.okTimer);
      this.okTimer = null;
    }
  }

  private cargar(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeOk = '';
    this.cdRef.detectChanges();

    this.configService.obtener()
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          const data = response?.datos ?? null;

          if (data) {
            this.asignarConfiguracion(data);
          } else {
            this.activarModoCrear();
          }

          this.cargando = false;
          this.recalcularNumeroSiguiente();
          this.cdRef.detectChanges();
        },
        error: (err: any) => {
          if (err?.status === 404) {
            this.activarModoCrear();
            this.cargando = false;
            this.recalcularNumeroSiguiente();
            this.cdRef.detectChanges();
            return;
          }

          this.cargando = false;
          this.mensajeError = this.extraerMensajeError(err, 'Error al cargar configuración.');
          this.cdRef.detectChanges();
        }
      });
  }

  private activarModoCrear(): void {
    this.modoCrear = true;
    this.configId = null;
    this.form = {
      ivaPorcentaje: 15,
      establecimiento: '001',
      puntoEmision: '001',
      ultimoSecuencial: 0
    };
  }

  private asignarConfiguracion(data: ConfiguracionDto): void {
    this.modoCrear = false;
    this.configId = data.confId;

    this.form = {
      ivaPorcentaje: Number(data.ivaPorcentaje ?? 0),
      establecimiento: data.establecimiento ?? '',
      puntoEmision: data.puntoEmision ?? '',
      ultimoSecuencial: Number(data.ultimoSecuencial ?? 0)
    };
  }

  recalcularNumeroSiguiente(): void {
    const est = this.pad3(this.form.establecimiento);
    const pe = this.pad3(this.form.puntoEmision);

    const ultimo = Number(this.form.ultimoSecuencial);
    const siguiente = Number.isFinite(ultimo) ? (Math.floor(ultimo) + 1) : 1;

    this.numeroSiguientePreview = `${est}-${pe}-${this.pad9(siguiente)}`;
    this.cdRef.detectChanges();
  }

  guardar(): void {
    this.mensajeError = '';
    this.mensajeOk = '';

    const iva = Number(this.form.ivaPorcentaje);
    if (!Number.isFinite(iva) || iva < 0) {
      this.setError('IVA inválido.');
      return;
    }

    const establecimiento = (this.form.establecimiento ?? '').trim();
    const puntoEmision = (this.form.puntoEmision ?? '').trim();

    if (!/^\d{3}$/.test(establecimiento)) {
      this.setError('Establecimiento debe tener 3 dígitos (ej: 001).');
      return;
    }

    if (!/^\d{3}$/.test(puntoEmision)) {
      this.setError('Punto de emisión debe tener 3 dígitos (ej: 001).');
      return;
    }

    const ultimoSecuencial = Number(this.form.ultimoSecuencial);
    if (!Number.isFinite(ultimoSecuencial) || ultimoSecuencial < 0) {
      this.setError('Último secuencial inválido.');
      return;
    }

    const dtoBase = {
      ivaPorcentaje: iva,
      establecimiento,
      puntoEmision,
      ultimoSecuencial: Math.floor(ultimoSecuencial)
    };

    this.cargando = true;
    this.cdRef.detectChanges();

    if (this.modoCrear) {
      const dto: ConfiguracionCrearDto = dtoBase;

      this.configService.crear(dto)
        .pipe(take(1))
        .subscribe({
          next: (response) => {
            const creada = response?.datos ?? null;

            if (creada) {
              this.asignarConfiguracion(creada);
            } else {
              this.modoCrear = false;
            }

            this.cargando = false;
            this.mensajeOk = 'Configuración creada correctamente.';
            this.recalcularNumeroSiguiente();
            this.cdRef.detectChanges();
            this.abrirModalOkAuto('Configuración creada correctamente.');
          },
          error: (err: any) => {
            if (err?.status === 200 || err?.status === 201) {
              this.cargando = false;
              this.mensajeOk = 'Configuración creada correctamente.';
              this.cdRef.detectChanges();
              this.abrirModalOkAuto('Configuración creada correctamente.');
              return;
            }

            this.cargando = false;
            this.mensajeError = this.extraerMensajeError(err, 'Error al crear configuración.');
            this.cdRef.detectChanges();
          }
        });

      return;
    }

    if (this.configId == null || this.configId <= 0) {
      this.cargando = false;
      this.setError('No se encontró el ID de la configuración para editar.');
      return;
    }

    const dto: ConfiguracionEditarDto = dtoBase;

    this.configService.editar(this.configId, dto)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.cargando = false;
          this.mensajeOk = 'Configuración actualizada correctamente.';
          this.recalcularNumeroSiguiente();
          this.cdRef.detectChanges();
          this.abrirModalOkAuto('Configuración actualizada correctamente.');
        },
        error: (err: any) => {
          if (err?.status === 200) {
            this.cargando = false;
            this.mensajeOk = 'Configuración actualizada correctamente.';
            this.recalcularNumeroSiguiente();
            this.cdRef.detectChanges();
            this.abrirModalOkAuto('Configuración actualizada correctamente.');
            return;
          }

          this.cargando = false;
          this.mensajeError = this.extraerMensajeError(err, 'Error al actualizar configuración.');
          this.cdRef.detectChanges();
        }
      });
  }

  private abrirModalOkAuto(msg: string): void {
    this.modalOkMensaje = msg;
    this.modalOkVisible = true;
    this.cdRef.detectChanges();

    if (this.okTimer) {
      clearTimeout(this.okTimer);
    }

    this.okTimer = setTimeout(() => {
      this.modalOkVisible = false;
      this.modalOkMensaje = '';
      this.cdRef.detectChanges();
    }, 2000);
  }

  volver(): void {
    this.router.navigate(['/panel/inicio']);
  }

  private pad3(v: string): string {
    const limpio = String(v ?? '').replace(/\D/g, '').slice(0, 3);
    return limpio.padStart(3, '0');
  }

  private pad9(n: number): string {
    const s = String(Math.max(0, Math.floor(n)));
    return s.padStart(9, '0');
  }

  private setError(msg: string): void {
    this.mensajeError = msg;
    this.cdRef.detectChanges();
  }

  private extraerMensajeError(err: any, porDefecto: string): string {
    if (!err) return porDefecto;

    if (typeof err.error === 'string' && err.error.trim()) {
      return err.error;
    }

    const errors = err?.error?.errors;
    if (errors && typeof errors === 'object') {
      const lista = Object.entries(errors)
        .flatMap(([campo, msgs]: any) =>
          (Array.isArray(msgs) ? msgs : [msgs]).map((m: any) => `${campo}: ${m}`)
        );

      if (lista.length) {
        return lista.join(' | ');
      }
    }

    if (err.error && typeof err.error === 'object') {
      const message =
        (typeof err.error.message === 'string' && err.error.message) ||
        (typeof err.error.title === 'string' && err.error.title) ||
        (typeof err.error.detail === 'string' && err.error.detail) ||
        '';

      if (message) {
        return message;
      }
    }

    if (typeof err.message === 'string' && err.message.trim()) {
      return err.message;
    }

    return porDefecto;
  }
}