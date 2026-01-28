import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {Flavour, Image, Plan, PlanInput} from '../../../core/graphql';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import gql from 'graphql-tag';
import {map, takeUntil} from 'rxjs/operators';
import {Apollo} from 'apollo-angular';
import {NotifierService} from "angular-notifier";

@Component({
    selector: 'visa-admin-plan-edit',
    templateUrl: './plan-edit.component.html',
})
export class PlanEditComponent implements OnInit, OnDestroy {

    private _form: FormGroup;
    private _flavours: Flavour[];
    private _compatibleFlavours: Flavour[];
    private _images: Image[];
    private _title: string;
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _multiCloudEnabled = false;

    private _planId: number;
    private _modalData$: Subject<{plan: Plan, clone: boolean}>;
    private _showEditModal = false;
    private _onSave$: EventEmitter<void> = new EventEmitter<void>();


    get showEditModal(): boolean {
        return this._showEditModal;
    }

    set showEditModal(value: boolean) {
        this._showEditModal = value;
    }

    @Input()
    set modalData$(value: Subject<{ plan: Plan, clone: boolean }>) {
        this._modalData$ = value;
    }

    @Output()
    get onSave(): EventEmitter<void> {
        return this._onSave$;
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

    get title(): string {
        return this._title;
    }

    constructor(private readonly _apollo: Apollo,
                private readonly _notifierService: NotifierService) {

        this._form = new FormGroup({
            image: new FormControl(null, Validators.required),
            flavour: new FormControl(null, Validators.required),
            preset: new FormControl(null),
        });
    }

    public ngOnInit(): void {
        this._modalData$.pipe(
            takeUntil(this._destroy$),
        ).subscribe(data => {
            const {plan, clone} = data;

            this._planId = null;
            if (plan) {
                if (clone) {
                    this._title = `Clone plan`;
                } else {
                    this._title = `Edit plan`;
                    this._planId = plan.id;
                }
                this._createFormFromPlan(plan);

            } else {
                this._title = `Create plan`;
                this._resetForm();
            }
            this._showEditModal = true;
        });

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

    ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
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
        this.onImageChange();
    }

    private _resetForm(): void {
        this.form.reset({
            image: null,
            flavour: null,
            preset: null,
        });
        this._compatibleFlavours = [];
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
            this._compatibleFlavours = cloudClient != null ? this._flavours.filter(flavour => flavour == null || flavour.cloudClient?.id === cloudClient.id) : [];
            const currentFlavour = this._form.value.flavour;
            if (currentFlavour) {
                if (!this._compatibleFlavours.find(flavour => flavour ? flavour.id === currentFlavour.id : false)) {
                    this.form.controls.flavour.reset();
                }
            }
        }
    }

    public onCancel(): void {
        this._showEditModal = false;
    }

    public submit(): void {
        const {image, flavour, preset} = this.form.value;
        const input = {
            imageId: image.id,
            flavourId: flavour.id,
            preset: preset == null ? false : preset,
        } as PlanInput;
        this._savePlan(input);
    }

    private _savePlan(input: PlanInput): void {
        if (this._planId == null) {
            this._apollo.mutate<any>({
                mutation: gql`
                    mutation CreatePlan($input: PlanInput!){
                        createPlan(input: $input) {
                            id
                            image {
                                id
                                name
                                description
                                icon
                                computeId
                                visible
                                cloudClient {
                                    id
                                    name
                                }
                            }
                            flavour {
                                id
                                name
                                memory
                                cpu
                                computeId
                            }
                        }
                    }
                `,
                variables: {input},
            }).pipe(
                takeUntil(this._destroy$)
            ).subscribe({
                next: () => {
                    this._notifierService.notify('success', 'Plan created');
                    this._showEditModal = false;
                    this._onSave$.next();
                },
                error: (error) => {
                    this._notifierService.notify('error', error);
                }
            })

        } else {
            this._apollo.mutate<any>({
                mutation: gql`
                        mutation UpdatePlan($id: Int!,$input: PlanInput!){
                            updatePlan(id:$id,input:$input) {
                                id
                                image {
                                    id
                                    name
                                    description
                                    icon
                                    computeId
                                    visible
                                    cloudClient {
                                        id
                                        name
                                    }
                                }
                                flavour {
                                    id
                                    name
                                    memory
                                    cpu
                                    computeId
                                }
                            }
                        }
                    `,
                variables: {id: this._planId, input},
            }).pipe(
                takeUntil(this._destroy$)
            ).subscribe({
                next: () => {
                    this._notifierService.notify('success', 'Plan saved');
                    this._showEditModal = false;
                    this._onSave$.next();
                },
                error: (error) => {
                    this._notifierService.notify('error', error);
                }
            })
        }
    }

}
