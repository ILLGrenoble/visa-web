// duration.validator.ts
import { AbstractControl, ValidationErrors } from '@angular/forms';
import {parseDurationString} from "../../common";

export function durationValidator(control: AbstractControl): ValidationErrors | null {
    const val = control.value;
    if (!val) return { required: true };

    const parsed = parseDurationString(val);
    return parsed === null ? { invalidDuration: true } : null;
}
