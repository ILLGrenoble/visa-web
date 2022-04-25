import {Component, OnInit } from '@angular/core';
import {Title} from '@angular/platform-browser';
import {Router} from '@angular/router';

@Component({
    selector: 'visa-compute-admin-header',
    styleUrls: ['./compute-header.component.scss'],
    templateUrl: './compute-header.component.html',
})
export class ComputeHeaderComponent implements OnInit {

    constructor(private router: Router, private titleService: Title) {
        this.router = router;
    }

    public ngOnInit(): void {
        if (!this.titleService.getTitle().endsWith(`Compute | Admin | VISA`)) {
            this.titleService.setTitle(`Compute | Admin | VISA`);
        }
    }
}
