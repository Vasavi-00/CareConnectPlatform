from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("appointments", "0001_initial"),
        ("accounts", "0008_cleanup_old_elderprofile_columns"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE appointments_appointment
                ADD COLUMN IF NOT EXISTS clinic_name VARCHAR(200) NOT NULL DEFAULT '';

                ALTER TABLE appointments_appointment
                ADD COLUMN IF NOT EXISTS appointment_at TIMESTAMPTZ;

                ALTER TABLE appointments_appointment
                ADD COLUMN IF NOT EXISTS created_by_id BIGINT NULL;

                UPDATE appointments_appointment
                SET
                    clinic_name = COALESCE(hospital, ''),
                    appointment_at = (
                        date::timestamp + time
                    )
                WHERE appointment_at IS NULL;

                ALTER TABLE appointments_appointment
                ALTER COLUMN appointment_at SET NOT NULL;

                ALTER TABLE appointments_appointment
                ADD CONSTRAINT appointments_appointment_created_by_id_fk
                FOREIGN KEY (created_by_id)
                REFERENCES accounts_familyprofile(id)
                DEFERRABLE INITIALLY DEFERRED;

                ALTER TABLE appointments_appointment
                DROP COLUMN IF EXISTS hospital;

                ALTER TABLE appointments_appointment
                DROP COLUMN IF EXISTS specialty;

                ALTER TABLE appointments_appointment
                DROP COLUMN IF EXISTS date;

                ALTER TABLE appointments_appointment
                DROP COLUMN IF EXISTS time;

                ALTER TABLE appointments_appointment
                DROP COLUMN IF EXISTS location;

                ALTER TABLE appointments_appointment
                DROP COLUMN IF EXISTS reminder;
            """,
            reverse_sql="""
                ALTER TABLE appointments_appointment
                ADD COLUMN IF NOT EXISTS hospital VARCHAR(200) NOT NULL DEFAULT '';

                ALTER TABLE appointments_appointment
                ADD COLUMN IF NOT EXISTS specialty VARCHAR(100) NOT NULL DEFAULT '';

                ALTER TABLE appointments_appointment
                ADD COLUMN IF NOT EXISTS date DATE;

                ALTER TABLE appointments_appointment
                ADD COLUMN IF NOT EXISTS time TIME;

                ALTER TABLE appointments_appointment
                ADD COLUMN IF NOT EXISTS location VARCHAR(255) NOT NULL DEFAULT '';

                ALTER TABLE appointments_appointment
                ADD COLUMN IF NOT EXISTS reminder BOOLEAN NOT NULL DEFAULT FALSE;
            """,
        ),
    ]