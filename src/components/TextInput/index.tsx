import React, {useEffect, useRef} from 'react';
import type {StyleProp, ViewStyle} from 'react-native';
import useThemeStyles from '@hooks/useThemeStyles';
import {isMobileChrome} from '@libs/Browser';
import DomUtils from '@libs/DomUtils';
import Visibility from '@libs/Visibility';
import BaseTextInput from './BaseTextInput';
import type {BaseTextInputProps} from './BaseTextInput/types';
import * as styleConst from './styleConst';

type RemoveVisibilityListener = () => void;

function TextInput({ref, ...props}: BaseTextInputProps) {
    const styles = useThemeStyles();
    const textInputRef = useRef<HTMLFormElement | null>(null);
    const removeVisibilityListenerRef = useRef<RemoveVisibilityListener>(null);
    const wasHiddenRef = useRef(false);

    useEffect(() => {
        let removeVisibilityListener = removeVisibilityListenerRef.current;
        if (props.disableKeyboard) {
            textInputRef.current?.setAttribute('inputmode', 'none');
        }

        if (props.name) {
            textInputRef.current?.setAttribute('name', props.name);
        }

        removeVisibilityListener = Visibility.onVisibilityChange(() => {
            const isVisible = Visibility.isVisible();

            if (!isVisible) {
                wasHiddenRef.current = true;
                return;
            }

            if (!isMobileChrome() || !textInputRef.current || DomUtils.getActiveElement() !== textInputRef.current) {
                return;
            }

            const showKeyboard = () => {
                if (!textInputRef.current) {
                    return;
                }
                // Blur and refocus to trigger keyboard. FormProvider will skip validation
                // because the same input regains focus immediately (checked via DomUtils.getActiveElement).
                textInputRef.current.blur();
                textInputRef.current.focus();
            };

            // Use setTimeout when returning from background to ensure app is fully foregrounded.
            // The visibilitychange event fires before Android fully restores the app, and the
            // Input Method Manager requires the app to be fully in the foreground to show the keyboard.
            if (wasHiddenRef.current) {
                wasHiddenRef.current = false;
                setTimeout(showKeyboard, 300);
            } else {
                showKeyboard();
            }
        });

        return () => {
            if (!removeVisibilityListener) {
                return;
            }
            removeVisibilityListener();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isLabeledMultiline = !!props.label?.length && props.multiline;
    const labelAnimationStyle = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        '--active-label-translate-y': `${styleConst.ACTIVE_LABEL_TRANSLATE_Y}px`,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        '--active-label-scale': `${styleConst.ACTIVE_LABEL_SCALE}`,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        '--label-transition-duration': `${styleConst.LABEL_ANIMATION_DURATION}ms`,
    };

    return (
        <BaseTextInput
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
            ref={(element) => {
                textInputRef.current = element as HTMLFormElement;

                if (!ref) {
                    return;
                }

                if (typeof ref === 'function') {
                    ref(element);
                    return;
                }

                // eslint-disable-next-line no-param-reassign
                ref.current = element;
            }}
            inputStyle={[styles.baseTextInput, styles.textInputDesktop, isLabeledMultiline ? styles.textInputMultiline : {}, props.inputStyle]}
            textInputContainerStyles={[labelAnimationStyle as StyleProp<ViewStyle>, props.textInputContainerStyles, styles.cursorText]}
        />
    );
}

export default TextInput;
