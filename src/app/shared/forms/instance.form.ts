import {UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';
import {Instance} from '@core';

export class InstanceForm extends UntypedFormGroup {

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

    private createScreenResolutionControl(): UntypedFormControl {
       return new UntypedFormControl(null, Validators.required);
    }

    private createNameControl(): UntypedFormControl {
        return new UntypedFormControl(null, Validators.compose([
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(100)]));
    }

    private createCommentsControl(): UntypedFormControl {
        return new UntypedFormControl(null, Validators.maxLength(2500));
    }

    private createAcceptedTermsControl(): UntypedFormControl {
        return new UntypedFormControl(false, Validators.compose([
            Validators.requiredTrue,
        ]));
    }

    private createKeyboardLayoutControl(): UntypedFormControl {
        return new UntypedFormControl(null, Validators.required);
    }

    private createUnrestrictedAccessControl(): UntypedFormControl {
        return new UntypedFormControl(false, Validators.required);
    }
}
