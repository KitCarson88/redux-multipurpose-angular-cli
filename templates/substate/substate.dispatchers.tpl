import { Injectable } from '@angular/core';

import { dispatch } from '@redux-multipurpose/core';

import {
    show,
    hide
} from './spinner.slice';

@Injectable()
export class SpinnerActions
{
    @dispatch()
    show = () => {
        return show(null);
    };

    @dispatch()
    hide = () => {
        return hide(null);
    };
}