import Link from 'next/link';
import RegisterForm from '@/components/auth/RegisterForm';
import { ROUTES } from '@/utils/constants';

export default function RegisterPage() {
  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h1>
        <p className="text-gray-600">Start shortening URLs in seconds</p>
      </div>

      <RegisterForm />

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link href={ROUTES.LOGIN} className="text-primary-600 hover:text-primary-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </>
  );
}