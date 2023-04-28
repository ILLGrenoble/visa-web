import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Flavour, Image, Plan, PlanInput} from '../../../core/graphql';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import gql from 'graphql-tag';
import {filter, map, takeUntil} from 'rxjs/operators';
import {Apollo} from 'apollo-angular';

@Component({
    selector: 'visa-admin-plan-update',
    templateUrl: './plan-edit.component.html',
})
export class PlanEditComponent implements OnInit {

    private _form: FormGroup;
    private _flavours: Flavour[];
    private _compatibleFlavours: Flavour[];
    private _images: Image[];
    private readonly _title: string;
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _onSave$: Subject<PlanInput> = new Subject<PlanInput>();
    private _multiCloudEnabled = false;

    constructor(private readonly _dialogRef: MatDialogRef<PlanEditComponent>,
                private readonly _apollo: Apollo,
                @Inject(MAT_DIALOG_DATA) {plan, clone}) {

        this._dialogRef.keydownEvents().pipe(filter(event => event.key === 'Escape')).subscribe(() => this._dialogRef.close());
        this._dialogRef.backdropClick().subscribe(() => this._dialogRef.close());

        this._form = new FormGroup({
            image: new FormControl(null, Validators.required),
            flavour: new FormControl(null, Validators.required),
            preset: new FormControl(null),
        });

        if (plan) {
            if (clone) {
                this._title = `Clone plan`;
            } else {
                this._title = `Edit plan`;
            }
            this._createFormFromPlan(plan);
        } else {
            this._title = `Create plan`;
        }
    }

    get form(): FormGroup {
        return this._form;
    }

    set form(value: FormGroup) {
        this._form = value;
    }

    get flavours(): Flavour[] {
        return this._compatibleFlavours;
    }

    get images(): Image[] {
        return this._images;
    }

    get onSave$(): Subject<PlanInput> {
        return this._onSave$;
    }

    get title(): string {
        return this._title;
    }

    public compareImage(image1: Image, image2: Image): boolean {
        if (image1 == null || image2 == null) {
            return false;
        }
        return image1.id === image2.id;
    }

    public compareFlavour(flavour1: Flavour, flavour2: Flavour): boolean {
        if (flavour1 == null || flavour2 == null) {
            return false;
        }
        return flavour1.id === flavour2.id;
    }

    private _createFormFromPlan(plan: Plan): void {
        const {
            image,
            flavour,
            preset,
        } = plan;
        this.form.reset({
            image,
            flavour,
            preset
        });

        // Initialise images and flavours from current plan
        this._images = [image];
        this._flavours = [flavour];
    }


    public ngOnInit(): void {
        this._apollo.query<any>({
            query: gql`
                query {
                    images {
                        id
                        name
                        version
                        cloudClient {
                            id
                            name
                        }
                    }
                    flavours  {
                        id
                        name
                        cloudClient {
                            id
                            name
                        }
                    }
                    cloudClients {
                        id
                        name
                    }
                }
            `
        }).pipe(
            map(({data}) => ({
                    images: data.images,
                    flavours: data.flavours,
                    cloudClients: data.cloudClients,
                })
            ),
            takeUntil(this._destroy$)
        ).subscribe(({images, flavours, cloudClients}) => {
            this._multiCloudEnabled = cloudClients.length > 1;
            this._images = images;
            flavours.unshift(null);
            this._flavours = flavours;
            this.onImageChange();
        });
    }

    public imageName(image: Image): string {
        if (this._multiCloudEnabled) {
            return image ? image.name + ' (version ' + image.version + ', ' + image.cloudClient.name + ' cloud provider)' : '';

        } else {
            return image ? image.name + ' (version ' + image.version + ')' : '';
        }
    }

    public onImageChange(): void {
        const currentImage = this._form.value.image;
        if (currentImage) {
            const cloudClient = currentImage.cloudClient;
            this._compatibleFlavours = this._flavours.filter(flavour => flavour == null || flavour.cloudClient.id === cloudClient.id);
            const currentFlavour = this._form.value.flavour;
            if (currentFlavour) {
                if (!this._compatibleFlavours.find(flavour => flavour ? flavour.id === currentFlavour.id : false)) {
                    this.form.controls.flavour.reset();
                }
            }
        }
    }

    public onCancel(): void {
        this._dialogRef.close();
    }

    public submit(): void {
        const {image, flavour, preset} = this.form.value;
        const input = {
            imageId: image.id,
            flavourId: flavour.id,
            preset: preset == null ? false : preset,
        } as PlanInput;
        this._onSave$.next(input);
    }

}
