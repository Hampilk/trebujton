import PasswordInput from '@components/PasswordInput';
import BasicCheckbox from '@ui/BasicCheckbox';
import ResetPasswordPopup from '@components/ResetPasswordPopup';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { toast } from 'react-toastify';
import { loginSchema } from '@/schemas/auth';
import classNames from 'classnames';

const LoginForm = ({ onSuccess, onError, showRememberMe = true, showResetPassword = true }) => {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, handleSubmit, formState: { errors }, control } = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
            rememberMe: false
        }
    });
    const navigate = useNavigate();
    const { signIn } = useAuth();

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            await signIn(data.email, data.password);
            toast.success('Logged in successfully!');
            if (onSuccess) {
                onSuccess(data);
            } else {
                navigate('/');
            }
        } catch (error) {
            console.error('Login error:', error);
            const errorMessage = error.message || 'Failed to log in. Please check your credentials.';
            toast.error(errorMessage);
            if (onError) {
                onError(error);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetPassword = e => {
        e.preventDefault();
        setOpen(true);
    }

    return (
        <>
            <h1>Account login</h1>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="d-flex flex-column g-10" style={{ margin: '20px 0 30px' }}>
                    <div className="d-flex flex-column g-20">
                        <input 
                            className={classNames('field', { 'field--error': errors.email })}
                            type="text"
                            placeholder="Login"
                            {...register('email')}
                            disabled={isSubmitting}
                        />
                        {errors.email && (
                            <p className="text-sm text-destructive">{errors.email.message}</p>
                        )}
                        <Controller 
                            control={control}
                            name="password"
                            render={({ field: { ref, onChange, value }, fieldState: { error } }) => (
                                <>
                                    <PasswordInput
                                        className={classNames('field', { 'field--error': error })}
                                        value={value}
                                        onChange={e => onChange(e.target.value)}
                                        placeholder="Password"
                                        innerRef={ref}
                                        disabled={isSubmitting}
                                    />
                                    {error && (
                                        <p className="text-sm text-destructive">{error.message}</p>
                                    )}
                                </>
                            )}
                        />
                    </div>
                    {showRememberMe && (
                        <div className="d-flex align-items-center g-10">
                            <Controller 
                                control={control}
                                name="rememberMe"
                                render={({ field: { ref, onChange, value } }) => (
                                    <BasicCheckbox 
                                        id="rememberMe"
                                        checked={value}
                                        onChange={e => onChange(e.target.checked)}
                                        innerRef={ref}
                                        disabled={isSubmitting}
                                    />
                                )}
                            />
                            <label htmlFor="rememberMe">Remember me</label>
                        </div>
                    )}
                </div>
                <div className="d-flex justify-content-between align-items-center">
                    <button className="btn btn--sm" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Logging in...' : 'Submit'}
                    </button>
                    {showResetPassword && (
                        <button 
                            className="text-button text-button--sm" 
                            onClick={handleResetPassword} 
                            disabled={isSubmitting}
                        >
                            Reset password
                        </button>
                    )}
                </div>
            </form>
            {showResetPassword && <ResetPasswordPopup open={open} onClose={() => setOpen(false)} />}
        </>
    )
}

export default LoginForm
