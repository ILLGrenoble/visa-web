import {Component, OnInit } from '@angular/core';
import {Title} from '@angular/platform-browser';
import {Router} from '@angular/router';

@Component({
    selector: 'visa-cloud-admin-header',
    styleUrls: ['./cloud-header.component.scss'],
    templateUrl: './cloud-header.component.html',
})
export class CloudHeaderComponent implements OnInit {

    constructor(private router: Router, private titleService: Title) {
        this.router = router;
    }

    public ngOnInit(): void {
        if (!this.titleService.getTitle().endsWith(`Cloud | Admin | VISA`)) {
            this.titleService.setTitle(`Cloud | Admin | VISA`);
        }
    }
}
