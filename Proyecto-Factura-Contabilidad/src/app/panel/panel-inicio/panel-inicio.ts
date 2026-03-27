import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-panel-inicio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './panel-inicio.html',
  styleUrl: './panel-inicio.css',
})
export class PanelInicioComponent implements OnInit {

  animar = false;

  ngOnInit(): void {
    // pequeña animación al cargar
    setTimeout(() => {
      this.animar = false;
    }, 200);
  }
}