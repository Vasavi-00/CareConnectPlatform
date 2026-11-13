from django.db import migrations


def drop_password_reset_otp_legacy_columns(apps, schema_editor):
    connection = schema_editor.connection
    table_name = "accounts_passwordresetotp"
    existing_tables = set(connection.introspection.table_names())
    if table_name not in existing_tables:
        return

    with connection.cursor() as cursor:
        existing_columns = {
            column.name
            for column in connection.introspection.get_table_description(
                cursor,
                table_name,
            )
        }
        for col_name in ("email", "otp_code", "is_used"):
            if col_name in existing_columns:
                cursor.execute(f'ALTER TABLE "{table_name}" DROP COLUMN "{col_name}"')


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0007_repair_password_reset_otp_schema"),
    ]

    operations = [
        migrations.RunPython(
            drop_password_reset_otp_legacy_columns,
            migrations.RunPython.noop,
        ),
    ]
