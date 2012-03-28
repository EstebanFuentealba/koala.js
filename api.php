<?PHP
$method = $_SERVER['REQUEST_METHOD'];
switch ($method) {
  case 'PUT':
    break;
  case 'POST': 
    break;
  case 'GET':
      echo json_encode(array(
        'items' => array(
            array('id_usuario' => 'juperez','firstname' => 'Juan', 'lastname' => 'Perez', 'comuna' => 4),
            array('id_usuario' => 'esfuentealba','firstname' => 'Esteban', 'lastname' => 'Fuentealba', 'comuna' => 2)
        )
    ));
    break;
  case 'DELETE': 
    break;
}


?>