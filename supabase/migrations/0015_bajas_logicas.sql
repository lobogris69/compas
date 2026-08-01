-- Compás — bajas lógicas de alumnos.
--
-- "Dar de baja" borraba la fila del alumno, y con ella se iban en cascada sus
-- pagos, su historial de asistencia y sus matrículas. Es decir: un clic
-- destruía la contabilidad de esa persona y el histórico que alimenta la
-- predicción. Además, una academia necesita conservar sus registros de cobro
-- aunque el alumno se marche.
--
-- Ahora la baja solo marca una fecha. El alumno desaparece de las listas y del
-- motor de balance, pero sus datos siguen ahí y se le puede readmitir.

alter table alumnos add column if not exists baja_at timestamptz;

create index if not exists alumnos_baja_idx on alumnos(academia_id, baja_at);

-- La columna tiene que estar en el grant por columnas (0012), o la app no
-- podría leerla: al revocar el SELECT de tabla, lo no concedido no se ve.
grant select (baja_at) on alumnos to anon, authenticated;
