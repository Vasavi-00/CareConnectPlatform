from django.db import migrations


def repair_password_reset_otp_schema(apps, schema_editor):
    PasswordResetOTP = apps.get_model("accounts", "PasswordResetOTP")
    connection = schema_editor.connection
    table_name = PasswordResetOTP._meta.db_table
    existing_tables = set(connection.introspection.table_names())

    if table_name not in existing_tables:
        schema_editor.create_model(PasswordResetOTP)
        return

    with connection.cursor() as cursor:
        existing_columns = {
            column.name
            for column in connection.introspection.get_table_description(
                cursor,
                table_name,
            )
        }
        missing_fields = [
            field
            for field in PasswordResetOTP._meta.local_concrete_fields
            if field.column not in existing_columns
        ]
        if not missing_fields:
            return

        quoted_table = schema_editor.quote_name(table_name)
        cursor.execute(f"SELECT COUNT(*) FROM {quoted_table}")
        row_count = cursor.fetchone()[0]
        if row_count:
            raise RuntimeError(
                "PasswordResetOTP has a legacy schema and existing rows; "
                "manual data reconciliation is required before this migration."
            )

    for field in missing_fields:
        schema_editor.add_field(PasswordResetOTP, field)


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0006_passwordresetotp"),
    ]

    operations = [
        migrations.RunPython(
            repair_password_reset_otp_schema,
            migrations.RunPython.noop,
        ),
    ]