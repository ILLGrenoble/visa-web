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

    public isRouteActive(url: string): boolean {
        return this.router.url.split('?')[0] === url;
    }

    public ngOnInit(): void {
        this.titleService.setTitle(`Cloud | Admin | VISA`);
    }
}
