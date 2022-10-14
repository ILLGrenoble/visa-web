import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Instance} from '@core';

export class InstanceForm extends FormGroup {

    public instance: Instance;

    constructor() {
        super({});
        this.addControl('name', this.createNameControl());
        this.addControl('acceptedTerms', this.createAcceptedTermsControl());
        this.addControl('comments', this.createCommentsControl());
        this.addControl('screenResolution', this.createScreenResolutionControl());
        this.addControl('keyboardLayout', this.createKeyboardLayoutControl());
        this.addControl('unrestrictedAccess', this.createUnrestrictedAccessControl());
    }

    private createScreenResolutionControl(): FormControl {
       return new FormControl(null, Validators.required);
    }

    private createNameControl(): FormControl {
        return new FormControl(null, Validators.compose([
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(100)]));
    }

    private createCommentsControl(): FormControl {
        return new FormControl(null, Validators.maxLength(2500));
    }

    private createAcceptedTermsControl(): FormControl {
        return new FormControl(false, Validators.compose([
            Validators.requiredTrue,
        ]));
    }

    private createKeyboardLayoutControl(): FormControl {
        return new FormControl(null, Validators.required);
    }

    private createUnrestrictedAccessControl(): FormControl {
        return new FormControl(false, Validators.required);
    }
}
