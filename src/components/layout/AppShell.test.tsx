import { render, screen } from '@testing-library/react';
import { AppShell } from './AppShell';

describe('AppShell', () => {
	it('renderiza el nombre del sistema y las rutas principales', () => {
		render(
			<AppShell activeHref="/products">
				<div>Contenido de prueba</div>
			</AppShell>,
		);

		expect(screen.getByText('GLOWSTOCK')).toBeTruthy();

		const productLink = screen.getAllByRole('link', { name: 'Productos' })[0];
		expect(productLink?.getAttribute('href')).toBe('/products');

		const dashboardLink = screen.getAllByRole('link', { name: 'Dashboard' })[0];
		expect(dashboardLink?.getAttribute('href')).toBe('/');

		expect(screen.getByText('Contenido de prueba')).toBeTruthy();
	});
});
