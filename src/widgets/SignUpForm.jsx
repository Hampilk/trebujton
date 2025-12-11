import PasswordInput from '@components/PasswordInput';
import Spring from '@components/Spring';
import { Fragment, useState } from 'react';
import { toast } from 'react-toastify';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { signupSchema } from '@/schemas/auth';
import classNames from 'classnames';

const SignUpForm = ({ standalone = true, onSuccess, onError }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, handleSubmit, formState: { errors }, control, reset } = useForm({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            fullName: '',
            email: '',
            password: '',
            confirmPassword: ''
        }
    });
    const { signUp } = useAuth();
    const navigate = useNavigate();

    const Wrapper = standalone ? Fragment : Spring;
    const wrapperProps = standalone ? {} : { className: 'card card-padded' };

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            await signUp(data.email, data.password, data.fullName);
            toast.success(`Account created! Please check your email ${data.email} to confirm your account.`);
            reset();
            if (onSuccess) {
                onSuccess(data);
            } else {
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            }
        } catch (error) {
            console.error('Sign up error:', error);
            const errorMessage = error.message || 'Failed to create account. Please try again.';
            toast.error(errorMessage);
            if (onError) {
                onError(error);
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Wrapper {...wrapperProps}>
            <div className="d-flex flex-column g-4">
                <h3>Create new account</h3>
                <p className="text-12">Fill out the form below to create a new account</p>
            </div>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="d-flex flex-column g-20" style={{ margin: '20px 0 30px' }}>
                    <div>
                        <input 
                            className={classNames('field', { 'field--error': errors.fullName })}
                            type="text"
                            placeholder="Full name"
                            {...register('fullName')}
                            disabled={isSubmitting}
                        />
                        {errors.fullName && (
                            <p className="text-sm text-destructive" style={{ marginTop: '4px' }}>
                                {errors.fullName.message}
                            </p>
                        )}
                    </div>
                    <div>
                        <input 
                            className={classNames('field', { 'field--error': errors.email })}
                            type="text"
                            placeholder="E-mail"
                            {...register('email')}
                            disabled={isSubmitting}
                        />
                        {errors.email && (
                            <p className="text-sm text-destructive" style={{ marginTop: '4px' }}>
                                {errors.email.message}
                            </p>
                        )}
                    </div>
                    <Controller 
                        control={control}
                        name="password"
                        render={({ field: { ref, onChange, value }, fieldState: { error } }) => (
                            <div>
                                <PasswordInput
                                    className={classNames('field', { 'field--error': error })}
                                    value={value}
                                    onChange={e => onChange(e.target.value)}
                                    placeholder="Password"
                                    innerRef={ref}
                                    disabled={isSubmitting}
                                />
                                {error && (
                                    <p className="text-sm text-destructive" style={{ marginTop: '4px' }}>
                                        {error.message}
                                    </p>
                                )}
                            </div>
                        )}
                    />
                    <Controller 
                        control={control}
                        name="confirmPassword"
                        render={({ field: { ref, onChange, value }, fieldState: { error } }) => (
                            <div>
                                <PasswordInput
                                    className={classNames('field', { 'field--error': error })}
                                    value={value}
                                    onChange={e => onChange(e.target.value)}
                                    placeholder="Confirm password"
                                    innerRef={ref}
                                    disabled={isSubmitting}
                                />
                                {error && (
                                    <p className="text-sm text-destructive" style={{ marginTop: '4px' }}>
                                        {error.message}
                                    </p>
                                )}
                            </div>
                        )}
                    />
                </div>
                <button type="submit" className="btn btn--sm" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating account...' : 'Create account'}
                </button>
            </form>
        </Wrapper>
    )
}

export default SignUpForm
