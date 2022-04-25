import {Component, OnInit } from '@angular/core';
import {Title} from '@angular/platform-browser';
import {Router} from '@angular/router';

@Component({
    selector: 'visa-settings-admin-header',
    styleUrls: ['./settings-header.component.scss'],
    templateUrl: './settings-header.component.html',
})
export class SettingsHeaderComponent implements OnInit {

    constructor(private router: Router, private titleService: Title) {
        this.router = router;
    }

    public ngOnInit(): void {
        if (!this.titleService.getTitle().endsWith(`Settings | Admin | VISA`)) {
            this.titleService.setTitle(`Settings | Admin | VISA`);
        }
    }
}
