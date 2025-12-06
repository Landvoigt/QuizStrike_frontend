import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AlertBoxComponent } from "./alert-box/alert-box.component";
import { FooterComponent } from "./footer/footer.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AlertBoxComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('Quizstrike_frontend');
  
}
