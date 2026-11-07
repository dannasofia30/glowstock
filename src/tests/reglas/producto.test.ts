import { esperarCodigo } from './ayudas';
import { validarProducto, type DatosProducto } from '../../lib/reglas/producto';

const productoValido: DatosProducto = {
  codigo: 'IT-001',
  nombre: 'Crema hidratante',
  categoria: 'Cuidado facial',
  precio: 20000,
  stockMinimo: 5,
};

describe('Validación de productos', () => {
  it('T-24: rechaza el precio cero', () => {
    esperarCodigo(() => validarProducto({ ...productoValido, precio: 0 }), 'DATOS_INVALIDOS');
  });

  it('T-25: rechaza un código en blanco', () => {
    esperarCodigo(() => validarProducto({ ...productoValido, codigo: ' ' }), 'DATOS_INVALIDOS');
  });

  it('T-26: acepta los datos válidos', () => {
    expect(() => validarProducto(productoValido)).not.toThrow();
  });
});